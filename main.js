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
let currentBoundary = 'left';
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
    if (!road.startPoint || !road.endPoint || road.leftBoundary.length < 2 || road.rightBoundary.length < 2) {
        alert('Please draw the road boundaries and set start/end points first!');
        return;
    }
    
    if (!car) {
        car = new Car(road.startPoint.x, road.startPoint.y);
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
    
    if (drawMode.value === 'boundary') {
        if (currentBoundary === 'left') {
            road.addLeftPoint(x, y);
        } else {
            road.addRightPoint(x, y);
        }
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
    
    if (drawMode.value === 'boundary') {
        if (currentBoundary === 'left') {
            road.addLeftPoint(x, y);
        } else {
            road.addRightPoint(x, y);
        }
    }
}

function stopDrawing() {
    isDrawing = false;
    if (drawMode.value === 'boundary') {
        currentBoundary = currentBoundary === 'left' ? 'right' : 'left';
    }
}

// Game loop
async function gameLoop() {
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw road
    road.draw(ctx);
    
    if (car) {
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
                    generation++;
                    updateUI();
                }
            }
            
            // Check if car is off road
            if (road.isPointOutsideRoad(car.x, car.y)) {
                reward = -100;
                done = true;
            }
            
            // Reward for moving towards goal
            if (!done) {
                const prevDistance = ai.getDistanceToGoal(car, road);
                const newDistance = Math.sqrt(
                    Math.pow(road.endPoint.x - car.x, 2) +
                    Math.pow(road.endPoint.y - car.y, 2)
                );
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
                car.reset(road.startPoint.x, road.startPoint.y);
            }
        }
        
        // Draw car
        car.draw(ctx);
    }
    
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