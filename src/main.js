import cytoscape from 'cytoscape';
import dagre from 'cytoscape-dagre';
import './styles.css';

cytoscape.use(dagre);

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', () => {
    // Initialize Cytoscape graph
    const cy = cytoscape({
        container: document.getElementById('cy'),
        elements: [],
        style: [
            {
                selector: 'node',
                style: {
                    'background-color': '#1f1f3a',
                    'border-color': '#4a4a6a',
                    'border-width': '1px',
                    'padding': '10px',
                    'color': '#e6e6e6',
                    'font-family': 'Fira Code, monospace',
                    'font-size': '12px',
                    'text-wrap': 'wrap',
                    'text-max-width': '600px',
                    'text-valign': 'center',
                    'text-halign': 'center',
                    'label': 'data(label)',
                    'shape': 'rectangle',
                    'width': 'label',
                    'height': 'label'
                }
            },
            {
                selector: 'edge',
                style: {
                    'width': 2,
                    'curve-style': 'straight',
                    'target-arrow-shape': 'triangle',
                    'target-arrow-color': '#6b4a8a',
                    'line-color': '#6b4a8a',
                    'arrow-scale': 1.5,
                    'label': 'data(label)',
                    'font-size': '11px',
                    'color': '#8a8aaf',
                    'text-rotation': 'autorotate',
                    'text-margin-y': -10,
                    'text-background-color': '#1f1f3a',
                    'text-background-opacity': 1,
                    'text-background-padding': '3px'
                }
            },
            {
                selector: '.jump-true',
                style: {
                    'line-color': '#ff6b8a',
                    'target-arrow-color': '#ff6b8a',
                    'line-style': 'solid',
                    'curve-style': 'straight',
                    'arrow-scale': 1.8,
                    'width': 3,
                    'text-background-color': '#1f1f3a',
                    'text-background-opacity': 1,
                    'text-background-padding': '3px',
                    'color': '#ff9ebd'
                }
            },
            {
                selector: '.jump-false',
                style: {
                    'line-color': '#4a8a6b',
                    'target-arrow-color': '#4a8a6b',
                    'line-style': 'dashed',
                    'curve-style': 'straight',
                    'arrow-scale': 1.5,
                    'width': 2,
                    'text-background-color': '#1f1f3a',
                    'text-background-opacity': 1,
                    'text-background-padding': '3px',
                    'color': '#8aff9e'
                }
            },
            {
                selector: '.highlighted',
                style: {
                    'background-color': '#2a2a4a',
                    'border-color': '#6b4a8a',
                    'border-width': '2px',
                    'color': '#ffffff',
                    'text-background-color': '#2a2a4a'
                }
            },
            {
                selector: 'node:selected',
                style: {
                    'border-width': '3px',
                    'border-color': '#ff9800',
                    'border-opacity': 1
                }
            },
            {
                selector: 'edge.highlighted',
                style: {
                    'width': 3,
                    'line-color': '#ff9800',
                    'target-arrow-color': '#ff9800',
                    'opacity': 1,
                    'z-index': 999
                }
            }
        ],
        layout: {
            name: 'dagre',
            rankDir: 'TB',
            nodeSep: 30,
            rankSep: 50,
            edgeSep: 30,
            fit: true,
            padding: 30
        },
        minZoom: 0.1,
        maxZoom: 10,
        wheelSensitivity: 0.2,
        userZoomingEnabled: true,
        userPanningEnabled: true,
        boxSelectionEnabled: false,
        selectionType: 'single',
        autoungrabify: false,
        autounselectify: false,
        autolock: false,
        panningEnabled: true,
        zoomingEnabled: true
    });
    
    // Add window resize event listener to handle responsive layout
    window.addEventListener('resize', () => {
        // Resize the graph if it exists
        if (cy) {
            cy.resize();
            cy.fit();
        }
        
        // Resize the second graph if it exists in comparison mode
        if (window.cy2) {
            window.cy2.resize();
            window.cy2.fit();
        }
        
        // Update the layout based on current mode
        const isCompareMode = document.getElementById('comparison-container') && 
                             document.getElementById('comparison-container').style.display !== 'none' &&
                             document.getElementById('output2') &&
                             document.getElementById('output2').style.display !== 'none';
        
        if (isCompareMode) {
            // Ensure the comparison container has the right height
            const comparisonContainer = document.getElementById('comparison-container');
            if (comparisonContainer) {
                comparisonContainer.style.height = '300px';
            }
            
            // Ensure the graph container takes the remaining space
            const graphContainer = document.getElementById('graph-container');
            if (graphContainer) {
                graphContainer.style.flex = '1';
                graphContainer.style.minHeight = '0';
            }
        }
    });

    // DOM Elements
    const bytecodeInput = document.getElementById('bytecode');
    const bytecodeInput2 = document.getElementById('bytecode2');
    const instructionsOutput = document.getElementById('output');
    const instructionsOutput2 = document.getElementById('output2');
    const compareButton = document.getElementById('compare-button');
    const compareToggle = document.getElementById('compare-toggle');
    
    let isCompareMode = false;

    // Toggle comparison mode
    compareToggle.addEventListener('click', () => {
        isCompareMode = !isCompareMode;
        compareToggle.classList.toggle('active');
        bytecodeInput2.style.display = isCompareMode ? 'block' : 'none';
        compareButton.textContent = isCompareMode ? 'Compare' : 'Disassemble';
        
        // Reset outputs when toggling
        instructionsOutput.innerHTML = '';
        if (instructionsOutput2) {
            instructionsOutput2.style.display = isCompareMode ? 'block' : 'none';
            instructionsOutput2.innerHTML = '';
        }
        
        // Reset the comparison container style
        const comparisonContainer = document.getElementById('comparison-container');
        if (comparisonContainer) {
            if (isCompareMode) {
                comparisonContainer.style.display = 'flex';
            } else {
                comparisonContainer.style.display = 'block';
                // Reset any flex styling that might have been applied
                comparisonContainer.style.flexDirection = '';
                comparisonContainer.style.gap = '';
            }
        }
        
        // Reset graphs
        if (window.cy) {
            window.cy.elements().remove();
        }
        
        // Clean up cy2 when switching back to single mode
        if (!isCompareMode && window.cy2) {
            try {
                if (typeof window.cy2.destroy === 'function') {
                    window.cy2.destroy();
                }
            } catch (error) {
                console.error('Error cleaning up cy2 instance:', error);
            }
            window.cy2 = null;
        }
        
        // Update graph container layout
        updateGraphLayout(isCompareMode);
    });

    function updateGraphLayout(isCompareMode) {
        console.log('Updating graph layout, compare mode:', isCompareMode);
        
        // Get the graph container element
        const graphContainer = document.getElementById('graph-container');
        if (!graphContainer) {
            console.error('Graph container not found');
            return;
        }
        
        // Remove any existing comparison controls
        const existingControls = document.getElementById('comparison-controls');
        if (existingControls) {
            existingControls.remove();
        }
        
        // Get the disassembly output container
        const disassemblyOutput = document.querySelector('.disassembly-output');
        if (!disassemblyOutput) {
            console.error('Disassembly output container not found');
            return;
        }
        
        // Get the graph output container
        const graphOutput = document.querySelector('.graph-output');
        if (!graphOutput) {
            console.error('Graph output container not found');
            return;
        }
        
        if (isCompareMode) {
            // In comparison mode, we'll create the containers in displaySplitGraphs
            console.log('Setting up for comparison mode');
            
            // Ensure the graph container doesn't overlap with the disassembly output
            graphOutput.style.display = 'flex';
            graphOutput.style.flexDirection = 'column';
            
            // Set a fixed height for the comparison container to prevent overlap
            const comparisonContainer = document.getElementById('comparison-container');
            if (comparisonContainer) {
                comparisonContainer.style.height = '300px';
                comparisonContainer.style.flexShrink = '0';
                comparisonContainer.style.overflow = 'auto';
            }
            
            // Make sure the graph container takes the remaining space
            graphContainer.style.flex = '1';
            graphContainer.style.minHeight = '0';
            graphContainer.style.overflow = 'hidden';
            
            // Hide any existing single graph container
            const singleGraphContainer = document.getElementById('cy-container');
            if (singleGraphContainer) {
                singleGraphContainer.style.display = 'none';
            }
            
            // Hide any existing controls for single graph
            const layoutControls = document.getElementById('layout-controls');
            if (layoutControls) {
                layoutControls.style.display = 'none';
            }
            
            const navigationControls = document.getElementById('navigation-controls');
            if (navigationControls) {
                navigationControls.style.display = 'none';
            }
        } else {
            // Single graph mode
            console.log('Setting up for single graph mode');
            
            // Reset the graph container styles
            graphContainer.style.display = 'block';
            graphContainer.style.gap = '';
            graphContainer.style.flexDirection = '';
            
            // Clear the graph container
            graphContainer.innerHTML = '';
            
            // Properly clean up existing cy2 instance if it exists
            if (window.cy2) {
                try {
                    if (typeof window.cy2.destroy === 'function') {
                        window.cy2.destroy();
                    }
                } catch (error) {
                    console.error('Error cleaning up cy2 instance:', error);
                }
                window.cy2 = null;
            }
            
            // Create a container for the single graph
            const singleGraphContainer = document.createElement('div');
            singleGraphContainer.id = 'cy-container';
            singleGraphContainer.style.position = 'relative';
            singleGraphContainer.style.width = '100%';
            singleGraphContainer.style.height = '100%';
            singleGraphContainer.style.flex = '1';
            singleGraphContainer.style.minHeight = '0';
            
            const cyDiv = document.createElement('div');
            cyDiv.id = 'cy';
            cyDiv.style.width = '100%';
            cyDiv.style.height = '100%';
            cyDiv.style.position = 'absolute';
            cyDiv.style.top = '0';
            cyDiv.style.left = '0';
            cyDiv.style.backgroundColor = '#1f1f3a';
            cyDiv.style.borderRadius = '4px';
            cyDiv.style.border = '1px solid #4a4a6a';
            
            singleGraphContainer.appendChild(cyDiv);
            graphContainer.appendChild(singleGraphContainer);
            
            // Show controls for single graph
            const layoutControls = document.getElementById('layout-controls');
            if (layoutControls) {
                layoutControls.style.display = 'block';
            } else {
                addLayoutControls();
            }
            
            const navigationControls = document.getElementById('navigation-controls');
            if (navigationControls) {
                navigationControls.style.display = 'block';
            } else {
                addNavigationControls();
            }
            
            // Initialize Cytoscape if needed
            if (!window.cy || !window.cy.container()) {
                window.cy = cytoscape({
                    container: document.getElementById('cy'),
                    elements: [],
                    style: [
                        {
                            selector: 'node',
                            style: {
                                'background-color': '#1f1f3a',
                                'border-color': '#4a4a6a',
                                'border-width': '1px',
                                'padding': '10px',
                                'color': '#e6e6e6',
                                'font-family': 'Fira Code, monospace',
                                'font-size': '12px',
                                'text-wrap': 'wrap',
                                'text-max-width': '600px',
                                'text-valign': 'center',
                                'text-halign': 'center',
                                'label': 'data(label)',
                                'shape': 'rectangle',
                                'width': 'label',
                                'height': 'label'
                            }
                        },
                        {
                            selector: 'edge',
                            style: {
                                'width': 2,
                                'curve-style': 'straight',
                                'target-arrow-shape': 'triangle',
                                'target-arrow-color': '#6b4a8a',
                                'line-color': '#6b4a8a',
                                'arrow-scale': 1.5,
                                'label': 'data(label)',
                                'font-size': '11px',
                                'color': '#8a8aaf',
                                'text-rotation': 'autorotate',
                                'text-margin-y': -10,
                                'text-background-color': '#1f1f3a',
                                'text-background-opacity': 1,
                                'text-background-padding': '3px'
                            }
                        },
                        {
                            selector: '.jump-true',
                            style: {
                                'line-color': '#ff6b8a',
                                'target-arrow-color': '#ff6b8a',
                                'line-style': 'solid',
                                'curve-style': 'straight',
                                'arrow-scale': 1.8,
                                'width': 3,
                                'text-background-color': '#1f1f3a',
                                'text-background-opacity': 1,
                                'text-background-padding': '3px',
                                'color': '#ff9ebd'
                            }
                        },
                        {
                            selector: '.jump-false',
                            style: {
                                'line-color': '#4a8a6b',
                                'target-arrow-color': '#4a8a6b',
                                'line-style': 'dashed',
                                'curve-style': 'straight',
                                'arrow-scale': 1.5,
                                'width': 2,
                                'text-background-color': '#1f1f3a',
                                'text-background-opacity': 1,
                                'text-background-padding': '3px',
                                'color': '#8aff9e'
                            }
                        },
                        {
                            selector: '.highlighted',
                            style: {
                                'background-color': '#2a2a4a',
                                'border-color': '#6b4a8a',
                                'border-width': '2px',
                                'color': '#ffffff',
                                'text-background-color': '#2a2a4a'
                            }
                        },
                        {
                            selector: 'node:selected',
                            style: {
                                'border-width': '3px',
                                'border-color': '#ff9800',
                                'border-opacity': 1
                            }
                        },
                        {
                            selector: 'edge.highlighted',
                            style: {
                                'width': 3,
                                'line-color': '#ff9800',
                                'target-arrow-color': '#ff9800',
                                'opacity': 1,
                                'z-index': 999
                            }
                        }
                    ]
                });
                
                // Add click handler for nodes to select and focus
                window.cy.on('tap', 'node', function(evt) {
                    const node = evt.target;
                    window.cy.nodes().unselect();
                    node.select();
                    
                    // Highlight connected edges
                    window.cy.edges().removeClass('highlighted');
                    node.connectedEdges().addClass('highlighted');
                    
                    // Update instruction display if available
                    const section = node.data('section');
                    if (section && section.instructions) {
                        // Highlight in the left panel
                        const output1 = document.getElementById('output');
                        if (output1) {
                            const instructionElements = output1.querySelectorAll('.instruction');
                            instructionElements.forEach(el => el.classList.remove('highlighted'));
                            
                            section.instructions.forEach(inst => {
                                const offset = inst.offset;
                                const matchingElement = output1.querySelector(`.instruction[data-offset="${offset}"]`);
                                if (matchingElement) {
                                    matchingElement.classList.add('highlighted');
                                    matchingElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                }
                            });
                        }
                    }
                });
            }
        }
    }

    // Event Listeners
    compareButton.addEventListener('click', async () => {
        console.log('Compare button clicked');
        const bytecode1 = bytecodeInput.value.trim();
        const bytecode2 = isCompareMode ? bytecodeInput2.value.trim() : null;
        
        console.log('Input bytecodes:', {
            bytecode1: bytecode1.slice(0, 50) + '...',
            bytecode2: bytecode2 ? bytecode2.slice(0, 50) + '...' : null,
            isCompareMode,
            bytecode1Length: bytecode1.length,
            bytecode2Length: bytecode2 ? bytecode2.length : 0
        });

        if (!bytecode1) {
            console.error('First bytecode input is empty');
            alert('Please enter the first EVM bytecode');
            return;
        }

        if (!/^(0x)?[0-9a-fA-F]*$/.test(bytecode1)) {
            console.error('Invalid characters in first bytecode:', bytecode1.match(/[^0-9a-fA-F]/g));
            alert('Invalid bytecode format in first input. Please enter hexadecimal characters only.');
            return;
        }

        if (isCompareMode && bytecode2 && !/^(0x)?[0-9a-fA-F]*$/.test(bytecode2)) {
            console.error('Invalid characters in second bytecode:', bytecode2.match(/[^0-9a-fA-F]/g));
            alert('Invalid bytecode format in second input. Please enter hexadecimal characters only.');
            return;
        }

        try {
            // Remove '0x' prefix if present
            const cleanBytecode1 = bytecode1.replace('0x', '');
            const cleanBytecode2 = bytecode2 ? bytecode2.replace('0x', '') : null;
            
            console.log('Clean bytecodes:', {
                cleanBytecode1: cleanBytecode1.slice(0, 50) + '...',
                cleanBytecode2: cleanBytecode2 ? cleanBytecode2.slice(0, 50) + '...' : null,
                cleanBytecode1Length: cleanBytecode1.length,
                cleanBytecode2Length: cleanBytecode2 ? cleanBytecode2.length : 0
            });
            
            // Call the Python backend to disassemble both bytecodes
            console.log('Disassembling bytecode 1...');
            let result1;
            try {
                result1 = await disassembleBytecode(cleanBytecode1);
                console.log('Result 1:', {
                    instructionsCount: result1.instructions.length,
                    sectionsCount: result1.sections.length,
                    jumpsCount: result1.jumps.length,
                    firstInstruction: result1.instructions[0],
                    lastInstruction: result1.instructions[result1.instructions.length - 1]
                });
            } catch (error) {
                console.error('Error disassembling bytecode 1:', error);
                throw error;
            }
            
            let result2 = null;
            if (isCompareMode && cleanBytecode2) {
                console.log('Disassembling bytecode 2...');
                try {
                    result2 = await disassembleBytecode(cleanBytecode2);
                    console.log('Result 2:', {
                        instructionsCount: result2.instructions.length,
                        sectionsCount: result2.sections.length,
                        jumpsCount: result2.jumps.length,
                        firstInstruction: result2.instructions[0],
                        lastInstruction: result2.instructions[result2.instructions.length - 1]
                    });
                } catch (error) {
                    console.error('Error disassembling bytecode 2:', error);
                    throw error;
                }
            }
            
            // Display the disassembled instructions and highlight differences
            console.log('Starting display process...');
            if (isCompareMode) {
                console.log('Displaying comparison view');
                displayComparison(result1, result2);
                if (result2) {
                    console.log('Displaying split graphs');
                    displaySplitGraphs(result1, result2);
                } else {
                    console.log('Displaying single graph');
                    displayGraph(result1.sections, result1.jumps);
                }
            } else {
                console.log('Displaying single view');
                displayInstructions(result1.instructions);
                displayGraph(result1.sections, result1.jumps);
            }
            
        } catch (error) {
            console.error('Error during disassembly:', error);
            // Create a more user-friendly error message
            const errorMessage = error.message.includes('Traceback') 
                ? error.message.split('\n')[0] // Only show the first line of the error
                : error.message;
            alert(`Error disassembling bytecode: ${errorMessage}`);
        }
    });

    // Display disassembled instructions side by side with differences highlighted
    function displayComparison(result1, result2) {
        console.log('Starting comparison display...');
        
        // Clear previous outputs
        const output1 = document.getElementById('output');
        const output2 = document.getElementById('output2');
        const comparisonContainer = document.getElementById('comparison-container');
        
        if (!output1 || !output2 || !comparisonContainer) {
            console.error('Output elements not found:', { output1, output2, comparisonContainer });
            return;
        }
        
        console.log('Output elements found and cleared');
        output1.innerHTML = "";
        output2.innerHTML = "";
        
        // If we only have one bytecode, display it normally
        if (!result2) {
            console.log('Single bytecode mode');
            displayInstructions(result1.instructions);
            
            // Clean up any existing cy2 instance
            if (window.cy2) {
                try {
                    if (typeof window.cy2.destroy === 'function') {
                        window.cy2.destroy();
                    }
                } catch (error) {
                    console.error('Error cleaning up cy2 instance:', error);
                }
                window.cy2 = null;
            }
            
            // Reset the comparison container style
            comparisonContainer.style.display = 'block';
            comparisonContainer.style.flexDirection = '';
            comparisonContainer.style.gap = '';
            comparisonContainer.style.height = '';
            comparisonContainer.style.flexShrink = '';
            
            updateGraphLayout(false);
            displayGraph(result1.sections, result1.jumps);
            
            // Show only the first output panel
            output1.style.display = 'block';
            output2.style.display = 'none';
            return;
        }

        console.log('Comparison mode - processing instructions');
        
        // Show both output panels
        output1.style.display = 'block';
        output2.style.display = 'block';
        comparisonContainer.style.display = 'flex';
        comparisonContainer.style.height = '300px';
        comparisonContainer.style.flexShrink = '0';
        comparisonContainer.style.overflow = 'auto';
        
        // Get the graph output container and ensure it's properly styled
        const graphOutput = document.querySelector('.graph-output');
        if (graphOutput) {
            graphOutput.style.display = 'flex';
            graphOutput.style.flexDirection = 'column';
            graphOutput.style.overflow = 'hidden';
        }
        
        // Get the graph container and ensure it's properly styled
        const graphContainer = document.getElementById('graph-container');
        if (graphContainer) {
            graphContainer.style.flex = '1';
            graphContainer.style.minHeight = '0';
            graphContainer.style.overflow = 'hidden';
        }
        
        const maxLength = Math.max(result1.instructions.length, result2.instructions.length);
        console.log(`Comparing ${maxLength} instructions`);
        
        // Display instructions side by side
        for (let i = 0; i < maxLength; i++) {
            const inst1 = result1.instructions[i];
            const inst2 = result2.instructions[i];
            
            if (inst1 && inst2) {
                // Check if instructions are different
                const isDifferent = inst1.opcode !== inst2.opcode || 
                                  inst1.operand !== inst2.operand;
                
                if (isDifferent) {
                    console.log(`Difference at index ${i}:`, { inst1, inst2 });
                }
                
                output1.appendChild(createInstructionElement(inst1, isDifferent));
                output2.appendChild(createInstructionElement(inst2, isDifferent));
            } else if (inst1) {
                output1.appendChild(createInstructionElement(inst1, true));
                output2.appendChild(document.createElement('div')); // Empty div for alignment
            } else if (inst2) {
                output1.appendChild(document.createElement('div')); // Empty div for alignment
                output2.appendChild(createInstructionElement(inst2, true));
            }
        }
        
        // Update layout for comparison mode and display both graphs
        updateGraphLayout(true);
        displaySplitGraphs(result1, result2);
    }

    // Helper function to create instruction element
    function createInstructionElement(instruction, isDifferent) {
        const instructionDiv = document.createElement("div");
        instructionDiv.className = "instruction" + (isDifferent ? " different" : "");
        instructionDiv.dataset.offset = instruction.offset;
        
        const content = document.createElement("div");
        content.className = "instruction-content";
        
        const offset = document.createElement("span");
        offset.className = "offset";
        offset.textContent = `0x${instruction.offset.toString(16).padStart(4, '0')}: `;
        
        const opcode = document.createElement("span");
        opcode.className = "opcode";
        opcode.textContent = instruction.opcode;
        
        const operand = document.createElement("span");
        operand.className = "operand";
        operand.textContent = instruction.operand ? ` ${instruction.operand}` : "";
        
        content.appendChild(offset);
        content.appendChild(opcode);
        content.appendChild(operand);
        
        instructionDiv.appendChild(content);
        return instructionDiv;
    }

    // Display two control flow graphs side by side
    function displaySplitGraphs(result1, result2) {
        console.log('Displaying split graphs for comparison');
        
        // Get the graph container element
        const graphContainer = document.getElementById('graph-container');
        if (!graphContainer) {
            console.error('Graph container not found');
            return;
        }
        
        // Clear any existing graph containers
        graphContainer.innerHTML = '';
        
        // Set the container to display flex for side-by-side layout
        graphContainer.style.display = 'flex';
        graphContainer.style.gap = '20px';
        graphContainer.style.position = 'relative';
        graphContainer.style.height = '100%';
        graphContainer.style.width = '100%';
        graphContainer.style.overflow = 'hidden';
        graphContainer.style.flexShrink = '0'; // Prevent the graph container from shrinking
        
        // Create a wrapper for the entire comparison layout
        const comparisonWrapper = document.createElement('div');
        comparisonWrapper.style.display = 'flex';
        comparisonWrapper.style.width = '100%';
        comparisonWrapper.style.height = '100%';
        comparisonWrapper.style.gap = '10px';
        
        // Create left graph container
        const leftGraphContainer = document.createElement('div');
        leftGraphContainer.className = 'graph-container-inner';
        leftGraphContainer.style.position = 'relative';
        leftGraphContainer.style.flex = '1';
        leftGraphContainer.style.height = '100%';
        leftGraphContainer.style.minHeight = '0';
        leftGraphContainer.style.maxHeight = '100%';
        
        const leftGraph = document.createElement('div');
        leftGraph.id = 'cy';
        leftGraph.style.width = '100%';
        leftGraph.style.height = '100%';
        leftGraph.style.position = 'absolute';
        leftGraph.style.top = '0';
        leftGraph.style.left = '0';
        leftGraph.style.backgroundColor = '#1f1f3a';
        leftGraph.style.borderRadius = '4px';
        leftGraph.style.border = '1px solid #4a4a6a';
        
        leftGraphContainer.appendChild(leftGraph);
        comparisonWrapper.appendChild(leftGraphContainer);
        
        // Create right graph container
        const rightGraphContainer = document.createElement('div');
        rightGraphContainer.className = 'graph-container-inner';
        rightGraphContainer.style.position = 'relative';
        rightGraphContainer.style.flex = '1';
        rightGraphContainer.style.height = '100%';
        rightGraphContainer.style.minHeight = '0';
        rightGraphContainer.style.maxHeight = '100%';
        
        const rightGraph = document.createElement('div');
        rightGraph.id = 'cy2';
        rightGraph.style.width = '100%';
        rightGraph.style.height = '100%';
        rightGraph.style.position = 'absolute';
        rightGraph.style.top = '0';
        rightGraph.style.left = '0';
        rightGraph.style.backgroundColor = '#1f1f3a';
        rightGraph.style.borderRadius = '4px';
        rightGraph.style.border = '1px solid #4a4a6a';
        
        rightGraphContainer.appendChild(rightGraph);
        comparisonWrapper.appendChild(rightGraphContainer);
        
        // Add the wrapper to the graph container
        graphContainer.appendChild(comparisonWrapper);
        
        // Properly clean up existing cy instance if it exists
        if (cy) {
            try {
                cy.destroy();
            } catch (error) {
                console.error('Error cleaning up cy instance:', error);
            }
        }
        
        // Properly clean up existing cy2 instance if it exists
        if (window.cy2) {
            try {
                if (typeof window.cy2.destroy === 'function') {
                    window.cy2.destroy();
                }
            } catch (error) {
                console.error('Error cleaning up cy2 instance:', error);
            }
            window.cy2 = null;
        }
        
        // Initialize first Cytoscape instance
        try {
            window.cy = cytoscape({
                container: document.getElementById('cy'),
                elements: [],
                style: [
                    {
                        selector: 'node',
                        style: {
                            'background-color': '#1f1f3a',
                            'border-color': '#4a4a6a',
                            'border-width': '1px',
                            'padding': '10px',
                            'color': '#e6e6e6',
                            'font-family': 'Fira Code, monospace',
                            'font-size': '12px',
                            'text-wrap': 'wrap',
                            'text-max-width': '600px',
                            'text-valign': 'center',
                            'text-halign': 'center',
                            'label': 'data(label)',
                            'shape': 'rectangle',
                            'width': 'label',
                            'height': 'label'
                        }
                    },
                    {
                        selector: 'edge',
                        style: {
                            'width': 2,
                            'curve-style': 'straight',
                            'target-arrow-shape': 'triangle',
                            'target-arrow-color': '#6b4a8a',
                            'line-color': '#6b4a8a',
                            'arrow-scale': 1.5,
                            'label': 'data(label)',
                            'font-size': '11px',
                            'color': '#8a8aaf',
                            'text-rotation': 'autorotate',
                            'text-margin-y': -10,
                            'text-background-color': '#1f1f3a',
                            'text-background-opacity': 1,
                            'text-background-padding': '3px'
                        }
                    },
                    {
                        selector: '.jump-true',
                        style: {
                            'line-color': '#ff6b8a',
                            'target-arrow-color': '#ff6b8a',
                            'line-style': 'solid',
                            'curve-style': 'straight',
                            'arrow-scale': 1.8,
                            'width': 3,
                            'text-background-color': '#1f1f3a',
                            'text-background-opacity': 1,
                            'text-background-padding': '3px',
                            'color': '#ff9ebd'
                        }
                    },
                    {
                        selector: '.jump-false',
                        style: {
                            'line-color': '#4a8a6b',
                            'target-arrow-color': '#4a8a6b',
                            'line-style': 'dashed',
                            'curve-style': 'straight',
                            'arrow-scale': 1.5,
                            'width': 2,
                            'text-background-color': '#1f1f3a',
                            'text-background-opacity': 1,
                            'text-background-padding': '3px',
                            'color': '#8aff9e'
                        }
                    },
                    {
                        selector: '.highlighted',
                        style: {
                            'background-color': '#2a2a4a',
                            'border-color': '#6b4a8a',
                            'border-width': '2px',
                            'color': '#ffffff',
                            'text-background-color': '#2a2a4a'
                        }
                    },
                    {
                        selector: 'node:selected',
                        style: {
                            'border-width': '3px',
                            'border-color': '#ff9800',
                            'border-opacity': 1
                        }
                    },
                    {
                        selector: 'edge.highlighted',
                        style: {
                            'width': 3,
                            'line-color': '#ff9800',
                            'target-arrow-color': '#ff9800',
                            'opacity': 1,
                            'z-index': 999
                        }
                    }
                ],
                minZoom: 0.1,
                maxZoom: 10,
                wheelSensitivity: 0.2,
                userZoomingEnabled: true,
                userPanningEnabled: true,
                boxSelectionEnabled: false,
                selectionType: 'single'
            });
            
            // Add click handler for nodes to select and focus
            window.cy.on('tap', 'node', function(evt) {
                const node = evt.target;
                window.cy.nodes().unselect();
                node.select();
                
                // Highlight connected edges
                window.cy.edges().removeClass('highlighted');
                node.connectedEdges().addClass('highlighted');
                
                // Update instruction display if available
                const section = node.data('section');
                if (section && section.instructions) {
                    // Highlight in the left panel
                    const output1 = document.getElementById('output');
                    if (output1) {
                        const instructionElements = output1.querySelectorAll('.instruction');
                        instructionElements.forEach(el => el.classList.remove('highlighted'));
                        
                        section.instructions.forEach(inst => {
                            const offset = inst.offset;
                            const matchingElement = output1.querySelector(`.instruction[data-offset="${offset}"]`);
                            if (matchingElement) {
                                matchingElement.classList.add('highlighted');
                                matchingElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                            }
                        });
                    }
                }
            });
            
            console.log('First Cytoscape instance created successfully');
        } catch (error) {
            console.error('Error creating first Cytoscape instance:', error);
        }
        
        // Initialize second Cytoscape instance
        try {
            window.cy2 = cytoscape({
                container: document.getElementById('cy2'),
                elements: [],
                style: [
                    {
                        selector: 'node',
                        style: {
                            'background-color': '#1f1f3a',
                            'border-color': '#4a4a6a',
                            'border-width': '1px',
                            'padding': '10px',
                            'color': '#e6e6e6',
                            'font-family': 'Fira Code, monospace',
                            'font-size': '12px',
                            'text-wrap': 'wrap',
                            'text-max-width': '600px',
                            'text-valign': 'center',
                            'text-halign': 'center',
                            'label': 'data(label)',
                            'shape': 'rectangle',
                            'width': 'label',
                            'height': 'label'
                        }
                    },
                    {
                        selector: 'edge',
                        style: {
                            'width': 2,
                            'curve-style': 'straight',
                            'target-arrow-shape': 'triangle',
                            'target-arrow-color': '#6b4a8a',
                            'line-color': '#6b4a8a',
                            'arrow-scale': 1.5,
                            'label': 'data(label)',
                            'font-size': '11px',
                            'color': '#8a8aaf',
                            'text-rotation': 'autorotate',
                            'text-margin-y': -10,
                            'text-background-color': '#1f1f3a',
                            'text-background-opacity': 1,
                            'text-background-padding': '3px'
                        }
                    },
                    {
                        selector: '.jump-true',
                        style: {
                            'line-color': '#ff6b8a',
                            'target-arrow-color': '#ff6b8a',
                            'line-style': 'solid',
                            'curve-style': 'straight',
                            'arrow-scale': 1.8,
                            'width': 3,
                            'text-background-color': '#1f1f3a',
                            'text-background-opacity': 1,
                            'text-background-padding': '3px',
                            'color': '#ff9ebd'
                        }
                    },
                    {
                        selector: '.jump-false',
                        style: {
                            'line-color': '#4a8a6b',
                            'target-arrow-color': '#4a8a6b',
                            'line-style': 'dashed',
                            'curve-style': 'straight',
                            'arrow-scale': 1.5,
                            'width': 2,
                            'text-background-color': '#1f1f3a',
                            'text-background-opacity': 1,
                            'text-background-padding': '3px',
                            'color': '#8aff9e'
                        }
                    },
                    {
                        selector: '.highlighted',
                        style: {
                            'background-color': '#2a2a4a',
                            'border-color': '#6b4a8a',
                            'border-width': '2px',
                            'color': '#ffffff',
                            'text-background-color': '#2a2a4a'
                        }
                    },
                    {
                        selector: 'node:selected',
                        style: {
                            'border-width': '3px',
                            'border-color': '#ff9800',
                            'border-opacity': 1
                        }
                    },
                    {
                        selector: 'edge.highlighted',
                        style: {
                            'width': 3,
                            'line-color': '#ff9800',
                            'target-arrow-color': '#ff9800',
                            'opacity': 1,
                            'z-index': 999
                        }
                    }
                ],
                minZoom: 0.1,
                maxZoom: 10,
                wheelSensitivity: 0.2,
                userZoomingEnabled: true,
                userPanningEnabled: true,
                boxSelectionEnabled: false,
                selectionType: 'single'
            });
            
            // Add click handler for nodes to select and focus in cy2
            window.cy2.on('tap', 'node', function(evt) {
                const node = evt.target;
                window.cy2.nodes().unselect();
                node.select();
                
                // Highlight connected edges
                window.cy2.edges().removeClass('highlighted');
                node.connectedEdges().addClass('highlighted');
                
                // Update instruction display if available
                const section = node.data('section');
                if (section && section.instructions) {
                    // Highlight in the right panel
                    const output2 = document.getElementById('output2');
                    if (output2) {
                        const instructionElements = output2.querySelectorAll('.instruction');
                        instructionElements.forEach(el => el.classList.remove('highlighted'));
                        
                        section.instructions.forEach(inst => {
                            const offset = inst.offset;
                            const matchingElement = output2.querySelector(`.instruction[data-offset="${offset}"]`);
                            if (matchingElement) {
                                matchingElement.classList.add('highlighted');
                                matchingElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                            }
                        });
                    }
                }
            });
            
            console.log('Second Cytoscape instance created successfully');
        } catch (error) {
            console.error('Error creating second Cytoscape instance:', error);
        }
        
        // Display graphs
        displayGraph(result1.sections, result1.jumps, window.cy);
        displayGraph(result2.sections, result2.jumps, window.cy2);
        
        // Add layout controls for both graphs
        addComparisonControls();
    }
    
    // Add controls for comparison mode
    function addComparisonControls() {
        console.log('Adding comparison controls');
        
        // Create controls container if it doesn't exist
        let controlsContainer = document.getElementById('comparison-controls');
        if (!controlsContainer) {
            controlsContainer = document.createElement('div');
            controlsContainer.id = 'comparison-controls';
            controlsContainer.style.display = 'flex';
            controlsContainer.style.flexDirection = 'column';
            controlsContainer.style.justifyContent = 'center';
            controlsContainer.style.alignItems = 'center';
            controlsContainer.style.padding = '10px';
            controlsContainer.style.backgroundColor = '#2a2a4a';
            controlsContainer.style.borderRadius = '4px';
            controlsContainer.style.zIndex = '10'; // Ensure it's above other elements
            controlsContainer.style.width = '180px'; // Make controls narrower
            controlsContainer.style.margin = '0 10px'; // Add margin on sides
            controlsContainer.style.flexShrink = '0'; // Prevent shrinking
            
            // Find the comparison wrapper
            const comparisonWrapper = document.querySelector('#graph-container > div');
            if (comparisonWrapper) {
                // Insert between the two graph containers
                comparisonWrapper.insertBefore(controlsContainer, comparisonWrapper.lastChild);
            } else {
                // If wrapper not found, add to the graph container
                const graphContainer = document.getElementById('graph-container');
                if (graphContainer) {
                    graphContainer.appendChild(controlsContainer);
                } else {
                    console.error('Graph container not found for adding controls');
                }
            }
        } else {
            // Clear existing controls
            controlsContainer.innerHTML = '';
        }
        
        // Create layout selection dropdown
        const layoutSelect = document.createElement('select');
        layoutSelect.id = 'comparison-layout-select';
        layoutSelect.style.width = '100%';
        layoutSelect.style.padding = '8px';
        layoutSelect.style.marginBottom = '15px';
        layoutSelect.style.backgroundColor = '#3a3a5a';
        layoutSelect.style.color = '#e6e6e6';
        layoutSelect.style.border = '1px solid #4a4a6a';
        layoutSelect.style.borderRadius = '4px';
        
        // Add layout options
        const layouts = [
            { value: 'sequential', label: 'Sequential (Top-Down)' },
            { value: 'horizontal', label: 'Horizontal (Left-Right)' }
        ];
        
        layouts.forEach(layout => {
            const option = document.createElement('option');
            option.value = layout.value;
            option.textContent = layout.label;
            if (layout.value === 'sequential') {
                option.selected = true;
            }
            layoutSelect.appendChild(option);
        });
        
        // Add zoom controls
        const zoomControls = document.createElement('div');
        zoomControls.style.display = 'flex';
        zoomControls.style.width = '100%';
        zoomControls.style.marginBottom = '15px';
        zoomControls.style.gap = '5px';
        
        const zoomInButton = document.createElement('button');
        zoomInButton.textContent = '+';
        zoomInButton.style.flex = '1';
        zoomInButton.style.padding = '8px';
        zoomInButton.style.backgroundColor = '#4a4a8a';
        zoomInButton.style.color = '#e6e6e6';
        zoomInButton.style.border = '1px solid #6a6aaa';
        zoomInButton.style.borderRadius = '4px';
        zoomInButton.style.cursor = 'pointer';
        
        const zoomOutButton = document.createElement('button');
        zoomOutButton.textContent = '-';
        zoomOutButton.style.flex = '1';
        zoomOutButton.style.padding = '8px';
        zoomOutButton.style.backgroundColor = '#4a4a8a';
        zoomOutButton.style.color = '#e6e6e6';
        zoomOutButton.style.border = '1px solid #6a6aaa';
        zoomOutButton.style.borderRadius = '4px';
        zoomOutButton.style.cursor = 'pointer';
        
        const fitButton = document.createElement('button');
        fitButton.textContent = 'Fit';
        fitButton.style.flex = '1';
        fitButton.style.padding = '8px';
        fitButton.style.backgroundColor = '#4a4a8a';
        fitButton.style.color = '#e6e6e6';
        fitButton.style.border = '1px solid #6a6aaa';
        fitButton.style.borderRadius = '4px';
        fitButton.style.cursor = 'pointer';
        
        zoomControls.appendChild(zoomInButton);
        zoomControls.appendChild(zoomOutButton);
        zoomControls.appendChild(fitButton);
        
        // Add navigation controls
        const navControls = document.createElement('div');
        navControls.style.display = 'flex';
        navControls.style.width = '100%';
        navControls.style.gap = '5px';
        
        const prevButton = document.createElement('button');
        prevButton.textContent = 'Prev';
        prevButton.style.flex = '1';
        prevButton.style.padding = '8px';
        prevButton.style.backgroundColor = '#4a4a8a';
        prevButton.style.color = '#e6e6e6';
        prevButton.style.border = '1px solid #6a6aaa';
        prevButton.style.borderRadius = '4px';
        prevButton.style.cursor = 'pointer';
        
        const nextButton = document.createElement('button');
        nextButton.textContent = 'Next';
        nextButton.style.flex = '1';
        nextButton.style.padding = '8px';
        nextButton.style.backgroundColor = '#4a4a8a';
        nextButton.style.color = '#e6e6e6';
        nextButton.style.border = '1px solid #6a6aaa';
        nextButton.style.borderRadius = '4px';
        nextButton.style.cursor = 'pointer';
        
        navControls.appendChild(prevButton);
        navControls.appendChild(nextButton);
        
        // Add all controls to the container
        controlsContainer.appendChild(layoutSelect);
        controlsContainer.appendChild(zoomControls);
        controlsContainer.appendChild(navControls);
        
        // Add event listeners
        layoutSelect.addEventListener('change', (e) => {
            const selectedLayout = e.target.value;
            // Apply the same layout to both graphs automatically
            applySelectedLayout(selectedLayout, window.cy);
            if (window.cy2) {
                applySelectedLayout(selectedLayout, window.cy2);
            }
        });
        
        zoomInButton.addEventListener('click', () => {
            if (window.cy) window.cy.zoom(window.cy.zoom() * 1.2);
            if (window.cy2) window.cy2.zoom(window.cy2.zoom() * 1.2);
        });
        
        zoomOutButton.addEventListener('click', () => {
            if (window.cy) window.cy.zoom(window.cy.zoom() / 1.2);
            if (window.cy2) window.cy2.zoom(window.cy2.zoom() / 1.2);
        });
        
        fitButton.addEventListener('click', () => {
            if (window.cy) window.cy.fit();
            if (window.cy2) window.cy2.fit();
        });
        
        prevButton.addEventListener('click', () => {
            navigateToAdjacentNode('prev', window.cy);
            navigateToAdjacentNode('prev', window.cy2);
        });
        
        nextButton.addEventListener('click', () => {
            navigateToAdjacentNode('next', window.cy);
            navigateToAdjacentNode('next', window.cy2);
        });
        
        return controlsContainer;
    }

    // Modified displayGraph to accept a specific Cytoscape instance
    function displayGraph(sections, jumps, cyInstance = cy) {
        console.log('Displaying graph with:', {
            sectionsCount: sections.length,
            jumpsCount: jumps.length,
            sections: sections.map(s => ({ 
                index: s.index,
                start: s.start, 
                end: s.end,
                instructions: s.instructions,
                instructionCount: s.instructions.length
            })),
            jumps: jumps.map(j => ({ 
                type: j.type, 
                from_section: j.from_section,
                target_section: j.target_section,
                fallthrough_section: j.fallthrough_section
            }))
        });

        // Check if sections have indices before processing
        const sectionsWithIndices = sections.filter(s => s.index !== undefined).length;
        console.log(`${sectionsWithIndices} out of ${sections.length} sections have indices`);
        
        if (sectionsWithIndices === 0) {
            console.error('No sections have indices, cannot create graph');
            return;
        }

        // Clear existing graph
        if (cyInstance && typeof cyInstance.elements === 'function') {
            cyInstance.elements().remove();
        } else {
            console.error('Invalid Cytoscape instance provided to displayGraph');
            return;
        }

        // Create nodes for each section
        sections.forEach((section, idx) => {
            // If section is missing an index, assign one based on array position
            if (section.index === undefined) {
                console.warn(`Section at position ${idx} missing index, assigning index ${idx}`);
                section.index = idx;
            }

            const nodeId = `section-${section.index}`;
            console.log('Creating node:', {
                id: nodeId,
                sectionIndex: section.index,
                sectionStart: section.start,
                sectionEnd: section.end,
                instructionCount: section.instructions.length,
                firstInstruction: section.instructions[0],
                lastInstruction: section.instructions[section.instructions.length - 1]
            });

            const instructions = section.instructions.map(inst => {
                const offset = `0x${inst.offset.toString(16).padStart(4, '0')}`;
                const opcode = inst.opcode.padEnd(10);
                const operand = inst.operand ? inst.operand : '';
                return `${offset} ${opcode} ${operand}`;
            }).join('\n');

            // Use the section's start offset as the primary rank to ensure sequential ordering
            cyInstance.add({
                group: 'nodes',
                data: {
                    id: nodeId,
                    label: instructions,
                    section: section,
                    rank: section.start,  // Use start offset for primary ranking
                    index: section.index  // Keep original index for reference
                }
            });
        });

        console.log('Created nodes:', cyInstance.nodes().length);

        // Create a set of valid node IDs for quick lookup
        const validNodeIds = new Set();
        cyInstance.nodes().forEach(node => {
            validNodeIds.add(node.id());
        });
        console.log('Valid node IDs:', Array.from(validNodeIds));

        // Add edges for all types of jumps
        let edgesAdded = 0;
        jumps.forEach(jump => {
            if (jump.from_section === undefined || jump.from_section === null) {
                console.error('Jump missing from_section:', {
                    jump,
                    type: jump.type,
                    hasTarget: 'target' in jump,
                    hasTargetSection: 'target_section' in jump,
                    hasFallthroughSection: 'fallthrough_section' in jump
                });
                return;
            }

            const sourceNode = `section-${jump.from_section}`;
            const targetNode = jump.target_section !== undefined && jump.target_section !== null ? `section-${jump.target_section}` : null;
            const fallthroughNode = jump.fallthrough_section !== undefined && jump.fallthrough_section !== null ? `section-${jump.fallthrough_section}` : null;
            
            // Validate that source and target nodes exist before creating edges
            const sourceExists = validNodeIds.has(sourceNode);
            const targetExists = targetNode ? validNodeIds.has(targetNode) : false;
            const fallthroughExists = fallthroughNode ? validNodeIds.has(fallthroughNode) : false;
            
            console.log('Processing jump:', {
                type: jump.type,
                sourceNode,
                targetNode,
                fallthroughNode,
                jump,
                sourceExists,
                targetExists,
                fallthroughExists
            });

            // Skip creating edges if source node doesn't exist
            if (!sourceExists) {
                console.error(`Cannot create edge: source node ${sourceNode} does not exist`);
                return;
            }

            // Handle JUMP edges
            if (jump.type === 'JUMP' && targetNode) {
                if (!targetExists) {
                    console.error(`Cannot create JUMP edge: target node ${targetNode} does not exist`);
                    return;
                }
                
                const edgeId = `edge-${sourceNode}-${targetNode}`;
                console.log('Adding JUMP edge:', edgeId);
                cyInstance.add({
                    group: 'edges',
                    data: {
                        id: edgeId,
                        source: sourceNode,
                        target: targetNode,
                        label: 'JUMP'
                    },
                    classes: 'jump-true'
                });
                edgesAdded++;
            } 
            // Handle JUMPI edges
            else if (jump.type === 'JUMPI') {
                console.log('Processing JUMPI jump:', {
                    from: jump.from_section,
                    target: jump.target,
                    target_section: jump.target_section,
                    fallthrough_section: jump.fallthrough_section
                });
                
                // Add true branch if target exists
                if (targetNode && targetExists) {
                    const edgeId = `edge-${sourceNode}-${targetNode}-true`;
                    console.log('Adding JUMPI[true] edge:', edgeId);
                    cyInstance.add({
                        group: 'edges',
                        data: {
                            id: edgeId,
                            source: sourceNode,
                            target: targetNode,
                            label: `JUMPI[true]`
                        },
                        classes: 'jump-true'
                    });
                    edgesAdded++;
                } else if (jump.target !== undefined && jump.target !== null) {
                    // If target_section is not specified but target is, try to find a matching section
                    console.warn('JUMPI true branch target_section not specified, checking target value:', jump.target);
                    
                    // Try to find the section that contains this jump target
                    const potentialTargetSections = sections.filter(s => 
                        s.start <= jump.target && jump.target <= s.end);
                    
                    if (potentialTargetSections.length > 0) {
                        const targetSection = potentialTargetSections[0];
                        const newTargetNode = `section-${targetSection.index}`;
                        
                        if (validNodeIds.has(newTargetNode)) {
                            const edgeId = `edge-${sourceNode}-${newTargetNode}-true`;
                            console.log('Adding inferred JUMPI[true] edge:', edgeId);
                            cyInstance.add({
                                group: 'edges',
                                data: {
                                    id: edgeId,
                                    source: sourceNode,
                                    target: newTargetNode,
                                    label: `JUMPI[true]`
                                },
                                classes: 'jump-true'
                            });
                            edgesAdded++;
                        } else {
                            console.error(`Inferred target node ${newTargetNode} does not exist`);
                        }
                    } else {
                        console.warn(`Could not find a section containing target offset ${jump.target}`);
                    }
                } else {
                    console.warn('JUMPI missing target information, cannot create true branch edge');
                }

                // Add false branch if fallthrough exists
                if (fallthroughNode && fallthroughExists) {
                    const edgeId = `edge-${sourceNode}-${fallthroughNode}-false`;
                    console.log('Adding JUMPI[false] edge:', edgeId);
                    cyInstance.add({
                        group: 'edges',
                        data: {
                            id: edgeId,
                            source: sourceNode,
                            target: fallthroughNode,
                            label: 'JUMPI[false]'
                        },
                        classes: 'jump-false'
                    });
                    edgesAdded++;
                } else {
                    console.warn('JUMPI missing fallthrough information, cannot create false branch edge');
                }
            }
            // Handle fallthrough edges
            else if (fallthroughNode) {
                if (!fallthroughExists) {
                    console.error(`Cannot create fallthrough edge: fallthrough node ${fallthroughNode} does not exist`);
                } else {
                    const edgeId = `edge-${sourceNode}-${fallthroughNode}-fallthrough`;
                    console.log('Adding fallthrough edge:', edgeId);
                    cyInstance.add({
                        group: 'edges',
                        data: {
                            id: edgeId,
                            source: sourceNode,
                            target: fallthroughNode,
                            label: 'fallthrough'
                        },
                        classes: 'jump-false'
                    });
                    edgesAdded++;
                }
            }
        });

        console.log('Created edges:', edgesAdded, 'Total edges in graph:', cyInstance.edges().length);

        // Debug JUMPI edges
        debugJumpiEdges(jumps, sections, cyInstance);

        // Apply layout only if we have nodes
        if (cyInstance.nodes().length > 0) {
            try {
                const layout = cyInstance.layout({
                    name: 'dagre',
                    rankDir: 'TB',  // Top to bottom direction
                    nodeSep: 50,    // Increased horizontal separation between nodes
                    rankSep: 80,    // Increased vertical separation between ranks
                    edgeSep: 40,    // Increased edge separation
                    ranker: 'network-simplex',  // Changed to network-simplex for better hierarchical layout
                    fit: true,
                    padding: 50,    // Increased padding
                    spacingFactor: 1.2,  // Increased spacing
                    animate: false,
                    animationDuration: 500,
                    sort: (a, b) => {
                        // Primary sort by start offset to ensure sequential ordering
                        return a.data('rank') - b.data('rank');
                    },
                    // Prioritize fallthrough edges over jump edges for layout
                    edgeWeight: edge => {
                        const label = edge.data('label') || '';
                        if (label.includes('fallthrough')) {
                            return 3;  // Highest priority for fallthrough edges
                        } else if (label.includes('JUMPI[false]')) {
                            return 2;  // Medium priority for JUMPI[false] edges
                        } else if (label.includes('JUMPI[true]')) {
                            return 1.5;  // Medium-low priority for JUMPI[true] edges
                        } else {
                            return 1;  // Lower priority for JUMP edges
                        }
                    },
                    nodeDimensionsIncludeLabels: true,
                    align: 'UL',    // Changed to upper-left alignment
                    acyclicer: 'greedy',
                    clusterEdges: false  // Disabled edge clustering for clearer paths
                });

                layout.run();
                console.log('Layout applied');

                // Initial fit with padding
                setTimeout(() => {
                    cyInstance.fit(30);
                    console.log('Graph fitted');
                    console.log('Final graph state:', {
                        nodes: cyInstance.nodes().length,
                        edges: cyInstance.edges().length
                    });
                }, 100);
            } catch (error) {
                console.error('Error applying layout:', error);
            }
        } else {
            console.error('No nodes to apply layout to');
        }
    }

    // Debug function to log JUMPI information
    function debugJumpiEdges(jumps, sections, cyInstance) {
        console.log('Debugging JUMPI edges:');
        
        // Count JUMPI instructions
        const jumpiJumps = jumps.filter(jump => jump.type === 'JUMPI');
        console.log(`Total JUMPI jumps: ${jumpiJumps.length}`);
        
        // Count JUMPI[true] and JUMPI[false] edges
        const trueEdges = cyInstance.edges().filter(edge => edge.data('label') === 'JUMPI[true]');
        const falseEdges = cyInstance.edges().filter(edge => edge.data('label') === 'JUMPI[false]');
        
        console.log(`JUMPI[true] edges: ${trueEdges.length}`);
        console.log(`JUMPI[false] edges: ${falseEdges.length}`);
        
        // Log details of each JUMPI jump
        jumpiJumps.forEach(jump => {
            console.log('JUMPI jump:', {
                from_section: jump.from_section,
                target: jump.target,
                target_section: jump.target_section,
                fallthrough_section: jump.fallthrough_section,
                has_true_edge: trueEdges.some(edge => 
                    edge.source().id() === `section-${jump.from_section}` && 
                    edge.target().id() === `section-${jump.target_section}`
                ),
                has_false_edge: falseEdges.some(edge => 
                    edge.source().id() === `section-${jump.from_section}` && 
                    edge.target().id() === `section-${jump.fallthrough_section}`
                )
            });
        });
    }

    // Display disassembled instructions
    function displayInstructions(instructions) {
        const output = document.getElementById('output');
        output.innerHTML = '';
        
        instructions.forEach(instruction => {
            const offset = `0x${instruction.offset.toString(16).padStart(4, '0')}:`;
            const opcode = instruction.opcode.padEnd(10);
            const operand = instruction.operand ? `0x${instruction.operand.replace('0x', '')}` : '';
            const rawBytes = instruction.raw_bytes ? `  // ${instruction.raw_bytes}` : '';
            
            const line = `${offset} ${opcode} ${operand}${rawBytes}`;
            const div = document.createElement('div');
            div.className = 'instruction';
            div.textContent = line;
            div.onclick = () => highlightInstruction(instruction.offset);
            output.appendChild(div);
        });
    }

    // Enhanced instruction highlighting
    function highlightInstruction(offset) {
        // Remove previous highlights
        cy.elements().removeClass('highlighted');
        
        // Find and highlight the node containing this instruction
        cy.nodes().forEach(node => {
            const section = node.data('section');
            if (section && offset >= section.start && offset <= section.end) {
                node.addClass('highlighted');
            }
        });
    }

    async function disassembleBytecode(bytecode) {
        try {
            console.log('Sending bytecode to backend for disassembly:', bytecode.slice(0, 50) + '...');
            
            // Show loading state
            const outputElement = document.getElementById('output');
            if (outputElement) {
                outputElement.innerHTML = '<div class="loading">Disassembling bytecode...</div>';
            }
            
            const response = await fetch('http://localhost:8000/disassemble', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ bytecode }),
                timeout: 30000 // 30 second timeout
            });
            
            if (!response.ok) {
                // Handle HTTP errors
                const errorText = await response.text();
                console.error('Backend error:', response.status, errorText);
                throw new Error(`Server error (${response.status}): ${errorText || 'Unknown error'}`);
            }
            
            const result = await response.json();
            console.log('Disassembly result received:', {
                instructionsCount: result.instructions ? result.instructions.length : 0,
                sectionsCount: result.sections ? result.sections.length : 0,
                jumpsCount: result.jumps ? result.jumps.length : 0
            });
            
            return result;
        } catch (error) {
            console.error('Error during disassembly:', error);
            
            // Provide user-friendly error message based on error type
            let errorMessage = 'An error occurred during disassembly.';
            
            if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
                errorMessage = 'Could not connect to the backend server. Please make sure the server is running.';
            } else if (error.name === 'AbortError') {
                errorMessage = 'The request timed out. The bytecode might be too large or complex.';
            } else if (error.message.includes('Server error')) {
                errorMessage = error.message;
            }
            
            // Display error in the UI
            const outputElement = document.getElementById('output');
            if (outputElement) {
                outputElement.innerHTML = `<div class="error-message">${errorMessage}</div>`;
            }
            
            // Also show an alert for immediate attention
            alert(errorMessage);
            
            // Return null to indicate failure
            return null;
        }
    }

    // Add layout selector controls
    function addLayoutControls() {
        const controlsContainer = document.createElement('div');
        controlsContainer.className = 'layout-controls';
        controlsContainer.style.position = 'absolute';
        controlsContainer.style.top = '10px';
        controlsContainer.style.right = '10px';
        controlsContainer.style.zIndex = '10';
        controlsContainer.style.background = '#1f1f3a';
        controlsContainer.style.padding = '10px';
        controlsContainer.style.borderRadius = '4px';
        controlsContainer.style.border = '1px solid #4a4a6a';
        
        const layoutLabel = document.createElement('label');
        layoutLabel.textContent = 'Layout: ';
        layoutLabel.style.color = '#e6e6e6';
        layoutLabel.style.marginRight = '10px';
        
        const layoutSelect = document.createElement('select');
        layoutSelect.id = 'layout-select';
        layoutSelect.style.background = '#2a2a4a';
        layoutSelect.style.color = '#e6e6e6';
        layoutSelect.style.border = '1px solid #4a4a6a';
        layoutSelect.style.padding = '5px';
        layoutSelect.style.borderRadius = '4px';
        layoutSelect.style.marginTop = '5px';
        
        const layouts = [
            { value: 'sequential', label: 'Sequential (Top-Down)' },
            { value: 'horizontal', label: 'Horizontal (Left-Right)' }
        ];
        
        layouts.forEach(layout => {
            const option = document.createElement('option');
            option.value = layout.value;
            option.textContent = layout.label;
            if (layout.value === 'sequential') {
                option.selected = true;
            }
            layoutSelect.appendChild(option);
        });
        
        layoutSelect.addEventListener('change', (e) => {
            const selectedLayout = e.target.value;
            // Apply the same layout to both graphs automatically
            applySelectedLayout(selectedLayout, cy);
            if (window.cy2) {
                applySelectedLayout(selectedLayout, window.cy2);
            }
        });
        
        controlsContainer.appendChild(layoutLabel);
        controlsContainer.appendChild(layoutSelect);
        
        const graphContainer = document.getElementById('graph-container');
        if (graphContainer) {
            graphContainer.style.position = 'relative';
            graphContainer.appendChild(controlsContainer);
        }
    }
    
    // Apply the selected layout
    function applySelectedLayout(layoutType, cyInstance = cy) {
        if (!cyInstance) return;
        
        let layoutOptions;
        
        switch(layoutType) {
            case 'sequential':
                layoutOptions = {
                    name: 'dagre',
                    rankDir: 'TB',
                    nodeSep: 50,
                    rankSep: 80,
                    edgeSep: 40,
                    ranker: 'network-simplex',
                    fit: true,
                    padding: 50,
                    spacingFactor: 1.2,
                    sort: (a, b) => a.data('rank') - b.data('rank'),
                    edgeWeight: edge => {
                        const label = edge.data('label') || '';
                        if (label.includes('fallthrough')) {
                            return 3;
                        } else if (label.includes('JUMPI[false]')) {
                            return 2;
                        } else if (label.includes('JUMPI[true]')) {
                            return 1.5;
                        } else {
                            return 1;
                        }
                    },
                    nodeDimensionsIncludeLabels: true,
                    align: 'UL',
                    acyclicer: 'greedy',
                    clusterEdges: false
                };
                break;
                
            case 'horizontal':
                layoutOptions = {
                    name: 'dagre',
                    rankDir: 'LR',  // Left to right direction
                    nodeSep: 50,
                    rankSep: 80,
                    edgeSep: 40,
                    ranker: 'network-simplex',
                    fit: true,
                    padding: 50,
                    spacingFactor: 1.2,
                    sort: (a, b) => a.data('rank') - b.data('rank'),
                    edgeWeight: edge => {
                        const label = edge.data('label') || '';
                        if (label.includes('fallthrough')) {
                            return 3;
                        } else if (label.includes('JUMPI[false]')) {
                            return 2;
                        } else if (label.includes('JUMPI[true]')) {
                            return 1.5;
                        } else {
                            return 1;
                        }
                    },
                    nodeDimensionsIncludeLabels: true,
                    align: 'DL',
                    acyclicer: 'greedy',
                    clusterEdges: false
                };
                break;
        }
        
        if (layoutOptions) {
            const layout = cyInstance.layout(layoutOptions);
            layout.run();
            
            // Fit graph after layout is complete
            setTimeout(() => {
                cyInstance.fit(30);
            }, 100);
        }
    }

    // Add layout controls after initialization
    setTimeout(addLayoutControls, 500);
    
    // Add navigation controls
    function addNavigationControls() {
        const navContainer = document.createElement('div');
        navContainer.className = 'navigation-controls';
        navContainer.style.position = 'absolute';
        navContainer.style.bottom = '10px';
        navContainer.style.right = '10px';
        navContainer.style.zIndex = '10';
        navContainer.style.background = '#1f1f3a';
        navContainer.style.padding = '10px';
        navContainer.style.borderRadius = '4px';
        navContainer.style.border = '1px solid #4a4a6a';
        navContainer.style.display = 'flex';
        navContainer.style.flexDirection = 'column';
        navContainer.style.gap = '10px';
        
        // Zoom controls
        const zoomContainer = document.createElement('div');
        zoomContainer.style.display = 'flex';
        zoomContainer.style.gap = '5px';
        
        const zoomInBtn = createButton('zoom-in', '+', () => {
            cy.zoom(cy.zoom() * 1.2);
        });
        
        const zoomOutBtn = createButton('zoom-out', '-', () => {
            cy.zoom(cy.zoom() / 1.2);
        });
        
        const fitBtn = createButton('fit', 'Fit', () => {
            cy.fit(30);
        });
        
        zoomContainer.appendChild(zoomInBtn);
        zoomContainer.appendChild(zoomOutBtn);
        zoomContainer.appendChild(fitBtn);
        
        navContainer.appendChild(zoomContainer);
        
        // Navigation buttons
        const navButtonsContainer = document.createElement('div');
        navButtonsContainer.style.display = 'flex';
        navButtonsContainer.style.gap = '5px';
        
        const prevBtn = createButton('prev-node', '◀', () => {
            navigateToAdjacentNode('prev');
        });
        
        const nextBtn = createButton('next-node', '▶', () => {
            navigateToAdjacentNode('next');
        });
        
        navButtonsContainer.appendChild(prevBtn);
        navButtonsContainer.appendChild(nextBtn);
        
        navContainer.appendChild(navButtonsContainer);
        
        const graphContainer = document.getElementById('graph-container');
        if (graphContainer) {
            graphContainer.appendChild(navContainer);
        }
    }
    
    // Navigate to adjacent node
    function navigateToAdjacentNode(direction, cyInstance = cy) {
        const selectedNodes = cyInstance.nodes(':selected');
        if (selectedNodes.length === 0) {
            // If no node is selected, select the first node
            const firstNode = cyInstance.nodes().first();
            if (firstNode.length > 0) {
                firstNode.select();
                cyInstance.animate({
                    fit: {
                        eles: firstNode,
                        padding: 100
                    }
                }, {
                    duration: 300
                });
            }
            return;
        }
        
        const currentNode = selectedNodes.first();
        let nextNode;
        
        if (direction === 'next') {
            // Try to find the next node by outgoing edge
            const outgoers = currentNode.outgoers('node');
            if (outgoers.length > 0) {
                nextNode = outgoers.first();
            } else {
                // If no outgoing edges, find the next node by rank
                const currentRank = currentNode.data('rank') || 0;
                nextNode = cyInstance.nodes().filter(node => {
                    return (node.data('rank') || 0) > currentRank;
                }).sort((a, b) => {
                    return (a.data('rank') || 0) - (b.data('rank') || 0);
                }).first();
            }
        } else { // prev
            // Try to find the previous node by incoming edge
            const incomers = currentNode.incomers('node');
            if (incomers.length > 0) {
                nextNode = incomers.first();
            } else {
                // If no incoming edges, find the previous node by rank
                const currentRank = currentNode.data('rank') || 0;
                nextNode = cyInstance.nodes().filter(node => {
                    return (node.data('rank') || 0) < currentRank;
                }).sort((a, b) => {
                    return (b.data('rank') || 0) - (a.data('rank') || 0);
                }).first();
            }
        }
        
        if (nextNode && nextNode.length > 0) {
            // Unselect current node
            currentNode.unselect();
            
            // Select and focus on the next node
            nextNode.select();
            cyInstance.animate({
                fit: {
                    eles: nextNode,
                    padding: 100
                }
            }, {
                duration: 300
            });
        }
    }
    
    // Reset graph view
    function resetGraphView() {
        // Reset all styles
        cy.elements().removeClass('path highlighted dimmed');
        
        // Fit to all elements
        cy.animate({
            fit: {
                padding: 30
            }
        }, {
            duration: 300
        });
    }
    
    // Add navigation controls after initialization
    setTimeout(addNavigationControls, 500);
    
    // Add styles for path tracing
    cy.style()
        .selector('node:selected')
        .style({
            'border-width': '3px',
            'border-color': '#ff9800',
            'border-opacity': 1
        })
        .update();
    
    // Add click handler for nodes to select and focus
    cy.on('tap', 'node', function(evt) {
        const node = evt.target;
        cy.nodes().unselect();
        node.select();
        
        // Highlight connected edges
        cy.edges().removeClass('highlighted');
        node.connectedEdges().addClass('highlighted');
        
        // Update instruction display if available
        const section = node.data('section');
        if (section && section.instructions) {
            highlightInstructions(section.instructions);
        }
    });
    
    // Add styles for highlighted elements
    cy.style()
        .selector('node:selected')
        .style({
            'border-width': '3px',
            'border-color': '#ff9800',
            'border-opacity': 1
        })
        .selector('edge.highlighted')
        .style({
            'line-color': '#ff9800',
            'target-arrow-color': '#ff9800',
            'width': 3,
            'opacity': 1
        })
        .update();

    // Helper function to create buttons
    function createButton(id, text, onClick) {
        const button = document.createElement('button');
        button.id = id;
        button.textContent = text;
        button.className = 'control-button';
        button.style.flex = '1';
        button.style.padding = '5px 10px';
        button.style.backgroundColor = '#3a3a5a';
        button.style.border = '1px solid #4a4a6a';
        button.style.borderRadius = '4px';
        button.style.color = 'white';
        button.style.cursor = 'pointer';
        button.addEventListener('click', onClick);
        return button;
    }
}); 