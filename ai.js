class AI {
    constructor() {
        // Neural network parameters
        this.inputSize = 7; // 5 sensors + angle to goal + distance to goal
        this.hiddenSize = 24;
        this.outputSize = 4; // forward, backward, left, right
        this.learningRate = 0.001;
        this.gamma = 0.95; // discount factor
        this.epsilon = 1.0; // exploration rate
        this.epsilonMin = 0.01;
        this.epsilonDecay = 0.995;
        
        // Create the neural network
        this.model = this.createModel();
        this.targetModel = this.createModel();
        this.updateTargetModel();
        
        // Training memory
        this.memory = [];
        this.memorySize = 10000;
        this.batchSize = 32;
    }

    // Create the neural network model
    createModel() {
        const model = tf.sequential();
        
        // Input layer
        model.add(tf.layers.dense({
            units: this.hiddenSize,
            inputShape: [this.inputSize],
            activation: 'relu'
        }));
        
        // Hidden layer
        model.add(tf.layers.dense({
            units: this.hiddenSize,
            activation: 'relu'
        }));
        
        // Output layer
        model.add(tf.layers.dense({
            units: this.outputSize,
            activation: 'linear'
        }));
        
        // Compile the model
        model.compile({
            optimizer: tf.train.adam(this.learningRate),
            loss: 'meanSquaredError'
        });
        
        return model;
    }

    // Update target model with current model weights
    updateTargetModel() {
        this.targetModel.setWeights(this.model.getWeights());
    }

    // Get state representation
    getState(car, road) {
        const sensorReadings = car.sense(road);
        const angleToGoal = this.getAngleToGoal(car, road);
        const distanceToGoal = this.getDistanceToGoal(car, road);
        
        return [...sensorReadings, angleToGoal, distanceToGoal];
    }

    // Calculate angle to goal
    getAngleToGoal(car, road) {
        if (!road.endPoint) return 0;
        
        const dx = road.endPoint.x - car.x;
        const dy = road.endPoint.y - car.y;
        let angle = Math.atan2(dy, dx) - car.angle;
        
        // Normalize angle to [-PI, PI]
        while (angle > Math.PI) angle -= 2 * Math.PI;
        while (angle < -Math.PI) angle += 2 * Math.PI;
        
        return angle;
    }

    // Calculate distance to goal
    getDistanceToGoal(car, road) {
        if (!road.endPoint) return 0;
        
        const dx = road.endPoint.x - car.x;
        const dy = road.endPoint.y - car.y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    // Choose action using epsilon-greedy policy
    async chooseAction(state) {
        if (Math.random() < this.epsilon) {
            // Random action
            return Math.floor(Math.random() * this.outputSize);
        }
        
        // Predict action using model
        const stateTensor = tf.tensor2d([state]);
        const prediction = await this.model.predict(stateTensor).data();
        stateTensor.dispose();
        
        return prediction.indexOf(Math.max(...prediction));
    }

    // Store experience in memory
    remember(state, action, reward, nextState, done) {
        this.memory.push([state, action, reward, nextState, done]);
        
        if (this.memory.length > this.memorySize) {
            this.memory.shift();
        }
    }

    // Train the model using experience replay
    async train() {
        if (this.memory.length < this.batchSize) return;
        
        // Sample random batch from memory
        const batch = this.getRandomBatch();
        
        // Prepare training data
        const states = batch.map(exp => exp[0]);
        const actions = batch.map(exp => exp[1]);
        const rewards = batch.map(exp => exp[2]);
        const nextStates = batch.map(exp => exp[3]);
        const dones = batch.map(exp => exp[4]);
        
        // Convert to tensors
        const statesTensor = tf.tensor2d(states);
        const nextStatesTensor = tf.tensor2d(nextStates);
        
        // Get current Q values
        const currentQ = await this.model.predict(statesTensor).array();
        
        // Get next Q values from target model
        const nextQ = await this.targetModel.predict(nextStatesTensor).array();
        
        // Update Q values
        for (let i = 0; i < this.batchSize; i++) {
            if (dones[i]) {
                currentQ[i][actions[i]] = rewards[i];
            } else {
                currentQ[i][actions[i]] = rewards[i] + this.gamma * Math.max(...nextQ[i]);
            }
        }
        
        // Train the model
        const targetTensor = tf.tensor2d(currentQ);
        await this.model.fit(statesTensor, targetTensor, {
            epochs: 1,
            verbose: 0
        });
        
        // Clean up tensors
        statesTensor.dispose();
        nextStatesTensor.dispose();
        targetTensor.dispose();
        
        // Update epsilon
        if (this.epsilon > this.epsilonMin) {
            this.epsilon *= this.epsilonDecay;
        }
    }

    // Get random batch from memory
    getRandomBatch() {
        const batch = [];
        for (let i = 0; i < this.batchSize; i++) {
            const randomIndex = Math.floor(Math.random() * this.memory.length);
            batch.push(this.memory[randomIndex]);
        }
        return batch;
    }

    // Save model weights
    async saveModel() {
        await this.model.save('indexeddb://ai-car-model');
    }

    // Load model weights
    async loadModel() {
        try {
            this.model = await tf.loadLayersModel('indexeddb://ai-car-model');
            this.updateTargetModel();
        } catch (error) {
            console.log('No saved model found');
        }
    }
} 