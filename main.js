// Initialize canvas and context
const canvas = document.getElementById('roadCanvas');
const ctx = canvas.getContext('2d');

// Set canvas size
canvas.width = 800;
canvas.height = 600;

// Initialize game objects
const road = new Road();
let car = null;
const ai = new AI();

// Game state
let isDrawing = false;
let isDrawingBlockage = false;
let lastX = 0;
let lastY = 0;
let isLearning = false;
let generation = 0;
let fitness = 0;

// Get UI elements
const clearBtn = document.getElementById('clearBtn');
const startBtn = document.getElementById('startBtn');
const resetBtn = document.getElementById('resetBtn');
const drawMode = document.getElementById('drawMode');
const generationSpan = document.getElementById('generation');
const fitnessSpan = document.getElementById('fitness');
const statusSpan = document.getElementById('status');

// Drawing event listeners
canvas.addEventListener('mousedown', startDrawing);
canvas.addEventListener('mousemove', draw);
canvas.addEventListener('mouseup', stopDrawing);
canvas.addEventListener('mouseout', stopDrawing);

// Button event listeners
clearBtn.addEventListener('click', () => {
    road.clear();
    if (car) {
        car = null;
    }
    isLearning = false;
    statusSpan.textContent = 'Ready';
});

startBtn.addEventListener('click', () => {
    if (!road.startPoint || !road.endPoint) {
        alert('Please set start and end points first!');
        return;
    }
    
    if (!car) {
        car = new Car(road.startPoint.x, road.startPoint.y);
        console.log('Car created at:', car.x, car.y);
    }
    
    isLearning = true;
    statusSpan.textContent = 'Learning';
    generation = 0;
    updateUI();
});

resetBtn.addEventListener('click', () => {
    if (car && road.startPoint) {
        car.reset(road.startPoint.x, road.startPoint.y);
    }
});

// Drawing functions
function startDrawing(e) {
    isDrawing = true;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    if (drawMode.value === 'blockage') {
        isDrawingBlockage = true;
        lastX = x;
        lastY = y;
    } else if (drawMode.value === 'start') {
        road.setStartPoint(x, y);
    } else if (drawMode.value === 'end') {
        road.setEndPoint(x, y);
    }
}

function draw(e) {
    if (!isDrawing) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    if (drawMode.value === 'blockage' && isDrawingBlockage) {
        // Draw a preview line while dragging
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        road.draw(ctx);
        
        // Redraw car if it exists
        if (car) {
            car.draw(ctx);
        }
        
        ctx.strokeStyle = '#e74c3c';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(lastX, lastY);
        ctx.lineTo(x, y);
        ctx.stroke();
    }
}

function stopDrawing(e) {
    if (!isDrawing) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    if (drawMode.value === 'blockage' && isDrawingBlockage) {
        // Add the blockage line
        road.addBlockageLine(lastX, lastY, x, y);
        isDrawingBlockage = false;
        
        // Redraw everything after adding blockage line
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        road.draw(ctx);
        if (car) {
            car.draw(ctx);
        }
    }
    
    isDrawing = false;
}

// Game loop
async function gameLoop() {
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // Only calculate distance if car exists
    const prevDistance = car ? ai.getDistanceToGoal(car, road) : 0;

    
    // Draw road
    road.draw(ctx);
    
    if (car) {
        if (
            car.x < 0 || car.x > canvas.width ||
            car.y < 0 || car.y > canvas.height
        ) {
            console.log('Car is off-canvas:', car.x, car.y);
        }
        
        // Get current state
        const state = ai.getState(car, road);
        
        if (isLearning) {
            // Choose action
            const action = await ai.chooseAction(state);
            
            // Apply action
            switch (action) {
                case 0: car.moveForward(); break;
                case 1: car.moveBackward(); break;
                case 2: car.turnLeft(); break;
                case 3: car.turnRight(); break;
            }
            
            // Update car position
            car.update();
            console.log('Car moved to:', car.x, car.y, 'speed:', car.speed);
            
            // Calculate reward
            let reward = 0;
            let done = false;
            
            // Check if car reached goal
            if (road.endPoint) {
                const dx = road.endPoint.x - car.x;
                const dy = road.endPoint.y - car.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < 10) {
                    reward = 1000;
                    done = true;
                }
            }
            
            // Check if car hits blockage
            if (road.isPointOnBlockage(car.x, car.y)) {
                console.log('Car hit blockage at:', car.x, car.y);
                reward = -100;
                done = true;
            }

            // Check if car leaves the canvas
            if (car.x < 0 || car.x > canvas.width || car.y < 0 || car.y > canvas.height) {
                console.log('Car left canvas at:', car.x, car.y);
                reward = -100;
                done = true;
            }
            
            // Reward for moving towards goal
            if (!done) {
                const newDistance = ai.getDistanceToGoal(car, road);
                reward = prevDistance - newDistance;
            }
            
            // Get next state
            const nextState = ai.getState(car, road);
            
            // Store experience
            ai.remember(state, action, reward, nextState, done);
            
            // Train the model
            await ai.train();
            
            // Update target model periodically
            if (generation % 10 === 0) {
                ai.updateTargetModel();
            }
            
            // Reset car if done
            if (done) {
                console.log('Car done - resetting. Reason: reached goal or hit blockage');
                generation++;
                updateUI();
                // Add a longer delay before resetting to make the result visible
                setTimeout(() => {
                    car.reset(road.startPoint.x, road.startPoint.y);
                    console.log('Car reset to:', car.x, car.y);
                }, 1000); // Increased from 100ms to 1000ms (1 second)
            }
        }
        
        // Draw car
        console.log('About to draw car at position:', car.x, car.y);
        car.draw(ctx);
        console.log('Finished drawing car');
    }
    
    // Final safeguard: Always draw car if it exists (at the very end)
    // if (car) {
    //     car.draw(ctx);
    // }
    
    // Test: Draw a small green rectangle to verify canvas is working
    ctx.fillStyle = '#00ff00';
    ctx.fillRect(canvas.width - 20, 10, 10, 10);
    
    // Continue game loop
    requestAnimationFrame(gameLoop);
}

// Update UI elements
function updateUI() {
    generationSpan.textContent = generation;
    fitnessSpan.textContent = fitness.toFixed(2);
}

// Start game loop
gameLoop();

// Load saved model if available
ai.loadModel(); 