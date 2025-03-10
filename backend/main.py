from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import traceback
import logging

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI()

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class BytecodeRequest(BaseModel):
    bytecode: str

def decompile_evm_bytecode(bytecode):
    # Remove '0x' prefix if present
    if bytecode.startswith('0x'):
        bytecode = bytecode[2:]
    
    # Convert hex string to bytes
    code_bytes = bytes.fromhex(bytecode)
    
    # Valid EVM opcodes (hex value -> name)
    valid_opcodes = {
        '00': 'STOP', '01': 'ADD', '02': 'MUL', '03': 'SUB', '04': 'DIV', '05': 'SDIV', '06': 'MOD', '07': 'SMOD',
        '08': 'ADDMOD', '09': 'MULMOD', '0a': 'EXP', '0b': 'SIGNEXTEND', '10': 'LT', '11': 'GT', '12': 'SLT', '13': 'SGT',
        '14': 'EQ', '15': 'ISZERO', '16': 'AND', '17': 'OR', '18': 'XOR', '19': 'NOT', '1a': 'BYTE', '1b': 'SHL', '1c': 'SHR',
        '1d': 'SAR', '20': 'KECCAK256', '30': 'ADDRESS', '31': 'BALANCE', '32': 'ORIGIN', '33': 'CALLER', '34': 'CALLVALUE',
        '35': 'CALLDATALOAD', '36': 'CALLDATASIZE', '37': 'CALLDATACOPY', '38': 'CODESIZE', '39': 'CODECOPY', '3a': 'GASPRICE',
        '3b': 'EXTCODESIZE', '3c': 'EXTCODECOPY', '3d': 'RETURNDATASIZE', '3e': 'RETURNDATACOPY', '3f': 'EXTCODEHASH', '40': 'BLOCKHASH',
        '41': 'COINBASE', '42': 'TIMESTAMP', '43': 'NUMBER', '44': 'DIFFICULTY', '45': 'GASLIMIT', '46': 'CHAINID', '47': 'SELFBALANCE',
        '48': 'BASEFEE', '50': 'POP', '51': 'MLOAD', '52': 'MSTORE', '53': 'MSTORE8', '54': 'SLOAD', '55': 'SSTORE', '56': 'JUMP',
        '57': 'JUMPI', '58': 'PC', '59': 'MSIZE', '5a': 'GAS', '5b': 'JUMPDEST', '5f': 'PUSH0', '5e' : 'MCOPY',
        '60': 'PUSH1', '61': 'PUSH2', '62': 'PUSH3', '63': 'PUSH4', '64': 'PUSH5', '65': 'PUSH6', '66': 'PUSH7', '67': 'PUSH8',
        '68': 'PUSH9', '69': 'PUSH10', '6a': 'PUSH11', '6b': 'PUSH12', '6c': 'PUSH13', '6d': 'PUSH14', '6e': 'PUSH15', '6f': 'PUSH16',
        '70': 'PUSH17', '71': 'PUSH18', '72': 'PUSH19', '73': 'PUSH20', '74': 'PUSH21', '75': 'PUSH22', '76': 'PUSH23', '77': 'PUSH24',
        '78': 'PUSH25', '79': 'PUSH26', '7a': 'PUSH27', '7b': 'PUSH28', '7c': 'PUSH29', '7d': 'PUSH30', '7e': 'PUSH31', '7f': 'PUSH32',
        '80': 'DUP1', '81': 'DUP2', '82': 'DUP3', '83': 'DUP4', '84': 'DUP5', '85': 'DUP6', '86': 'DUP7', '87': 'DUP8',
        '88': 'DUP9', '89': 'DUP10', '8a': 'DUP11', '8b': 'DUP12', '8c': 'DUP13', '8d': 'DUP14', '8e': 'DUP15', '8f': 'DUP16',
        '90': 'SWAP1', '91': 'SWAP2', '92': 'SWAP3', '93': 'SWAP4', '94': 'SWAP5', '95': 'SWAP6', '96': 'SWAP7', '97': 'SWAP8',
        '98': 'SWAP9', '99': 'SWAP10', '9a': 'SWAP11', '9b': 'SWAP12', '9c': 'SWAP13', '9d': 'SWAP14', '9e': 'SWAP15', '9f': 'SWAP16',
        'a0': 'LOG0', 'a1': 'LOG1', 'a2': 'LOG2', 'a3': 'LOG3', 'a4': 'LOG4',
        'f0': 'CREATE', 'f1': 'CALL', 'f2': 'CALLCODE', 'f3': 'RETURN', 'f4': 'DELEGATECALL', 'f5': 'CREATE2',
        'fa': 'STATICCALL', 'fd': 'REVERT', 'fe': 'INVALID', 'ff': 'SELFDESTRUCT'
    }
    
    # Store the detailed output for debugging/UI
    detailed_output = []
    
    # Store the simplified output (desired format)
    simplified_output = []
    
    offset = 0
    in_metadata = False
    metadata_start = None
    
    while offset < len(code_bytes):
        # Get the opcode byte
        opcode_byte = code_bytes[offset:offset+1].hex()
        
        # Check if we've reached the metadata section
        if not in_metadata and opcode_byte == 'fe' and offset > 0x1d:
            # Check if this is the INVALID that marks the start of metadata
            # This is typically after the last JUMP or RETURN in the contract
            in_metadata = True
            metadata_start = offset + 1
        
        # Handle the byte based on whether we're in metadata or not
        if not in_metadata:
            # Regular opcode processing
            if opcode_byte in valid_opcodes:
                opcode_name = valid_opcodes[opcode_byte]
                
                # For PUSH operations, get the operand
                operand = None
                operand_size = 0
                
                if opcode_name.startswith('PUSH') and opcode_name != 'PUSH0':
                    # Extract the number from PUSH<n>
                    operand_size = int(opcode_name[4:])
                    
                    # Check if we have enough bytes left
                    if offset + 1 + operand_size <= len(code_bytes):
                        operand_bytes = code_bytes[offset+1:offset+1+operand_size]
                        operand = '0x' + operand_bytes.hex().upper()
                    else:
                        # Not enough bytes for the operand, truncate
                        operand_bytes = code_bytes[offset+1:]
                        operand = '0x' + operand_bytes.hex().upper() + '...'
                        operand_size = len(operand_bytes)
                
                # Add to detailed output
                if operand:
                    detailed_output.append({
                        'offset': offset,
                        'opcode': opcode_name,
                        'operand': operand,
                        'size': 1 + operand_size,
                        'raw_bytes': opcode_byte + (operand_bytes.hex() if operand_bytes else '')
                    })
                    simplified_output.append(f"{opcode_name} {operand}")
                else:
                    detailed_output.append({
                        'offset': offset,
                        'opcode': opcode_name,
                        'operand': None,
                        'size': 1,
                        'raw_bytes': opcode_byte
                    })
                    simplified_output.append(f"{opcode_name}")
                
                # Move to the next instruction
                offset += 1 + operand_size
            else:
                # Unknown opcode (treated as INVALID for executable code)
                detailed_output.append({
                    'offset': offset,
                    'opcode': 'INVALID',
                    'operand': None,
                    'size': 1,
                    'raw_bytes': opcode_byte
                })
                simplified_output.append(f"INVALID")
                offset += 1
        else:
            # Special handling for metadata
            # Check for known metadata markers
            if offset == metadata_start and offset + 5 < len(code_bytes):
                # Check for PUSH5 dipfsX
                if code_bytes[offset:offset+6].hex() == '646970667358':
                    operand_bytes = code_bytes[offset+1:offset+6]
                    operand = '0x' + operand_bytes.hex().upper()
                    detailed_output.append({
                        'offset': offset,
                        'opcode': 'PUSH5',
                        'operand': operand,
                        'size': 6,
                        'raw_bytes': '646970667358'
                    })
                    simplified_output.append(f"PUSH5 {operand}")
                    offset += 6
                    continue
                # Check for PUSH5 dsolcC
                elif code_bytes[offset:offset+6].hex() == '64736f6c6343':
                    operand_bytes = code_bytes[offset+1:offset+6]
                    operand = '0x' + operand_bytes.hex().upper()
                    detailed_output.append({
                        'offset': offset,
                        'opcode': 'PUSH5',
                        'operand': operand,
                        'size': 6,
                        'raw_bytes': '64736f6c6343'
                    })
                    simplified_output.append(f"PUSH5 {operand}")
                    offset += 6
                    continue
            
            # For other metadata bytes, try to map to opcodes if possible
            if opcode_byte in valid_opcodes:
                opcode_name = valid_opcodes[opcode_byte]
                
                # For PUSH operations in metadata, get the operand
                operand = None
                operand_size = 0
                
                if opcode_name.startswith('PUSH') and opcode_name != 'PUSH0':
                    operand_size = int(opcode_name[4:])
                    
                    if offset + 1 + operand_size <= len(code_bytes):
                        operand_bytes = code_bytes[offset+1:offset+1+operand_size]
                        operand = '0x' + operand_bytes.hex().upper()
                    else:
                        operand_bytes = code_bytes[offset+1:]
                        operand = '0x' + operand_bytes.hex().upper() + '...'
                        operand_size = len(operand_bytes)
                
                # Add to outputs
                if operand:
                    detailed_output.append({
                        'offset': offset,
                        'opcode': opcode_name,
                        'operand': operand,
                        'size': 1 + operand_size,
                        'raw_bytes': opcode_byte + (operand_bytes.hex() if operand_bytes else '')
                    })
                    simplified_output.append(f"{opcode_name} {operand}")
                else:
                    detailed_output.append({
                        'offset': offset,
                        'opcode': opcode_name,
                        'operand': None,
                        'size': 1,
                        'raw_bytes': opcode_byte
                    })
                    simplified_output.append(f"{opcode_name}")
                
                offset += 1 + operand_size
            else:
                # For non-opcode bytes in metadata, just show the raw hex
                detailed_output.append({
                    'offset': offset,
                    'opcode': f"0x{opcode_byte.upper()}",
                    'operand': None,
                    'size': 1,
                    'raw_bytes': opcode_byte
                })
                simplified_output.append(f"0x{opcode_byte.upper()}")
                offset += 1
    
    # Join the detailed output with newlines for display
    detailed_result = '\n'.join(f"0x{inst['offset']:04x}: {inst['opcode']}" + (f" {inst['operand']}" if inst['operand'] else "") + f" // {inst['raw_bytes']}" for inst in detailed_output)
    
    # Join the simplified output with spaces for the desired format
    simplified_result = ' '.join(simplified_output)
    
    return {
        'instructions': detailed_output,  # For frontend compatibility
        'disassembly': simplified_result  # For the flat string format
    }

@app.post("/disassemble")
async def disassemble_bytecode(request: BytecodeRequest):
    try:
        # Use the decompile_evm_bytecode function to process the bytecode
        result = decompile_evm_bytecode(request.bytecode)
        
        # Extract instructions, sections, and jumps for frontend compatibility
        instructions = result['instructions']
        
        # Initialize sections and jumps
        sections = []
        jumps = []
        section_index = 0
        current_section = {'start': 0, 'end': 0, 'instructions': [], 'index': section_index}
        section_starts = {0: section_index}
        jump_dests = set()
        
        # Determine if we have metadata by looking for patterns
        # Instead of using hardcoded offset, we'll detect metadata more intelligently
        metadata_start = None
        
        # First pass: identify potential metadata markers and collect JUMPDEST positions
        for i, inst in enumerate(instructions):
            if inst['opcode'] == 'JUMPDEST':
                jump_dests.add(inst['offset'])
            
            # Look for common metadata markers
            if i > 0 and inst['opcode'] == 'INVALID' and i < len(instructions) - 1:
                # Check if this might be the start of metadata section
                next_inst = instructions[i + 1]
                if next_inst['opcode'].startswith('PUSH') and (
                    'dipfs' in next_inst.get('raw_bytes', '') or 
                    'dsolc' in next_inst.get('raw_bytes', '')):
                    metadata_start = inst['offset']
                    logger.info(f"Detected metadata starting at offset 0x{metadata_start:x}")
                    break
        
        # If we couldn't detect metadata, assume it's all executable code
        if metadata_start is None:
            logger.info("No metadata detected, treating all bytecode as executable")
        
        # Second pass: create sections and jumps (only for executable code)
        offset = 0
        for inst in instructions:
            # Skip if we've identified this as metadata
            if metadata_start is not None and inst['offset'] >= metadata_start:
                continue
                
            current_section['instructions'].append(inst)
            current_section['end'] = inst['offset']
            
            # Check if this instruction ends the current section
            ends_section = inst['opcode'] in ['JUMP', 'JUMPI', 'STOP', 'RETURN', 'REVERT', 'INVALID'] or (inst['offset'] + inst['size'] in jump_dests)
            if ends_section:
                sections.append({
                    'start': current_section['start'],
                    'end': current_section['end'],
                    'instructions': current_section['instructions'].copy(),  # Use copy to avoid reference issues
                    'index': section_index
                })
                
                logger.info(f"Created section {section_index} with {len(current_section['instructions'])} instructions (start=0x{current_section['start']:x}, end=0x{current_section['end']:x})")
                
                # Handle jumps
                if inst['opcode'] == 'JUMP':
                    jumps.append({
                        'type': 'JUMP',
                        'from_section': section_index,
                        'target': inst['operand'],
                        'target_section': None,
                        'fallthrough_section': None
                    })
                elif inst['opcode'] == 'JUMPI':
                    next_section = section_index + 1
                    jumps.append({
                        'type': 'JUMPI',
                        'from_section': section_index,
                        'target': inst['operand'],
                        'target_section': None,
                        'fallthrough_section': next_section
                    })
                elif inst['offset'] + inst['size'] < (metadata_start or float('inf')):
                    jumps.append({
                        'type': 'fallthrough',
                        'from_section': section_index,
                        'target': None,
                        'target_section': None,
                        'fallthrough_section': section_index + 1
                    })
                
                section_index += 1
                if inst['offset'] + inst['size'] < (metadata_start or float('inf')):
                    current_section = {
                        'start': inst['offset'] + inst['size'],
                        'end': inst['offset'] + inst['size'],
                        'instructions': [],
                        'index': section_index
                    }
                    section_starts[inst['offset'] + inst['size']] = section_index
        
        # Add the last section if not in metadata
        if current_section['instructions'] and current_section['end'] < (metadata_start or float('inf')):
            sections.append({
                'start': current_section['start'],
                'end': current_section['end'],
                'instructions': current_section['instructions'].copy(),  # Use copy to avoid reference issues
                'index': section_index
            })
            logger.info(f"Added final section {section_index} with {len(current_section['instructions'])} instructions (start=0x{current_section['start']:x}, end=0x{current_section['end']:x})")

        # Resolve jump targets (only within executable code)
        for jump in jumps:
            if jump.get('target'):
                target_offset = int(jump['target'][2:], 16)  # Remove '0x' and convert hex to int
                if target_offset < (metadata_start or float('inf')) and target_offset in jump_dests:
                    for section in sections:
                        if section['start'] <= target_offset <= section['end']:
                            jump['target_section'] = section['index']
                            logger.info(f"Resolved jump target: type={jump['type']}, from={jump['from_section']}, target_offset=0x{target_offset:x}, target_section={section['index']}")
                            break
                    if jump['target_section'] is None:
                        logger.warning(f"Could not resolve jump target: type={jump['type']}, from={jump['from_section']}, target_offset=0x{target_offset:x}")

        # Validate all jumps to ensure they reference valid sections
        valid_section_indices = set(section['index'] for section in sections)
        logger.info(f"Valid section indices: {valid_section_indices}")
        
        for jump in jumps:
            if jump['from_section'] not in valid_section_indices:
                logger.warning(f"Jump has invalid from_section: {jump['from_section']}, setting to None")
                jump['from_section'] = None
            if jump['target_section'] is not None and jump['target_section'] not in valid_section_indices:
                logger.warning(f"Jump has invalid target_section: {jump['target_section']}, setting to None")
                jump['target_section'] = None
            if jump['fallthrough_section'] is not None and jump['fallthrough_section'] not in valid_section_indices:
                logger.warning(f"Jump has invalid fallthrough_section: {jump['fallthrough_section']}, setting to None")
                jump['fallthrough_section'] = None

        # Prepare the response
        response = {
            "instructions": result['instructions'],
            "sections": sections,
            "jumps": jumps,
            "disassembly": result['disassembly']
        }
        
        logger.info(f"Disassembly complete: {len(instructions)} instructions, {len(sections)} sections, {len(jumps)} jumps")
        return response
        
    except Exception as e:
        logger.error(f"Error during disassembly: {str(e)}\nTraceback: {traceback.format_exc()}")
        raise HTTPException(status_code=400, detail=f"Error during disassembly: {str(e)}\nTraceback: {traceback.format_exc()}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)