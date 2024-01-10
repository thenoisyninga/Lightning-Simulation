const canvasSketch = require("canvas-sketch");
const { squaredDistance } = require("canvas-sketch-util/lib/vec2");
const math = require("canvas-sketch-util/math");
const random = require("canvas-sketch-util/random");

let width = 2048;
let height = 2048;

let n = 500;
let spreadDistance = 250;
let size = 15;
let dampingFactor = 0.99;
let connectionLineWidthMax = 5;
let energyLossPerTransfer = 0.05;

const settings = {
  dimensions: [width, height],
  animate: true,
  fps: 30,
  playbackRate: "throttle",
};

class Vector2D {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }

  add(other2DVector) {
    this.x += other2DVector.x;
    this.y += other2DVector.y;
  }

  multiply(x) {
    return new Vector2D(this.x * x, this.y * x);
  }

  negative() {
    return Vector2D(this.x * -1, this.y * -1);
  }

  magnitude() {
    return Math.sqrt(this.x * this.x + this.y * this.y);
  }

  direction() {
    let direction = Math.atan(this.x / this.y);

    return direction;
  }
}

class ChargeConnection {
  constructor(chargedParticle1, chargedParticle2) {
    this.chargedParticle1 = chargedParticle1;
    this.chargedParticle2 = chargedParticle2;
    this.strength = 0;
  }

  calculateStrength() {
    this.strength =
      (this.chargedParticle1.charge + this.chargedParticle2.charge) / 2;
  }

  draw(context) {
    this.calculateStrength();

    context.save();
    context.lineCap = "round";
    context.strokeStyle = "white";
    context.lineWidth = connectionLineWidthMax * this.strength + 1;
    context.beginPath();
    context.moveTo(this.chargedParticle1.pos.x, this.chargedParticle1.pos.y);
    context.lineTo(this.chargedParticle2.pos.x, this.chargedParticle2.pos.y);
    context.stroke();
    context.restore();
  }
}

class ChargedParticle {
  constructor(pos, dampingFactor) {
    this.pos = pos;
    this.dampingFactor = dampingFactor;
    this.charge = 0;
    this.size = size;
  }

  dampen() {
    this.charge *= dampingFactor;
  }

  chargeParticle(nextChargeEnergy) {
    this.charge += nextChargeEnergy;
    this.charge %= 1;
  }

  // Draw the particles
  draw(context) {
    context.save();
    context.beginPath();
    context.translate(this.pos.x, this.pos.y);
    context.lineWidth = 1;

    context.strokeStyle = `rgba(256, 256, 256, 1)`;
    context.fillStyle = `rgba(256, 256, 256, 1)`;

    // if (this.charge == 0) {
    //   context.strokeStyle = `rgba(256, 0, 0, 1)`;
    //   context.fillStyle = `rgba(256, 0, 0, 1)`;
    // } else {
    //   context.strokeStyle = `rgba(256, 256, 256, ${this.charge})`;
    //   context.fillStyle = `rgba(256, 256, 256, ${this.charge})`;
    // }

    context.arc(
      0,
      0,
      Math.abs((this.size / 2) * this.charge),
      0,
      Math.PI * 2.0
    );
    context.stroke();
    context.fill();
    context.restore();
  }
}

const sketch = ({ context, width, height }) => {
  // Run on start
  let particlesList = [];
  let connectionsList = [];

  let currentParticleIndex = 0;
  let nextParticleIndex = -1;

  function getNearbyParticle(currentParticleIndexP) {
    let currParticle = particlesList[currentParticleIndexP];
    let result = -1;

    for (let i = 0; i < n; i++) {
      let nextParticle = particlesList[i];

      // Calculating the distance between the particles
      particleDistance = Math.sqrt(
        Math.pow(currParticle.pos.x - nextParticle.pos.x, 2) +
          Math.pow(currParticle.pos.y - nextParticle.pos.y, 2)
      );

      if (
        // The next particle is close enough
        particleDistance < spreadDistance &&
        // checking if the particle already has charge or not
        nextParticle.charge < 0.01
        // checking if the particle is itself or not
        // &&
        // currentParticleIndex != nextParticleIndex
      ) {
        result = i;
        break;
      }
    }

    return result;
  }

  for (let i = 0; i < n; i++) {
    let x = random.range(0, width);
    let y = random.range(0, height);
    let particle = new ChargedParticle(new Vector2D(x, y), dampingFactor);

    particlesList.push(particle);
  }

  // Charge the starting particle

  particlesList[currentParticleIndex].charge = 1;

  let drawingComplete = false;

  // Run on each frame
  return ({ context, width, height }) => {
    context.fillStyle = "black";
    context.fillRect(0, 0, width, height);

    if (!drawingComplete) {
      // Select a nearby particle

      nextParticleIndex = getNearbyParticle(currentParticleIndex);

      if (nextParticleIndex >= 0) {
        // Charge the nearby particle accordingly
        let nextChargeEnergy =
          particlesList[currentParticleIndex].charge - energyLossPerTransfer;

        particlesList[nextParticleIndex].chargeParticle(nextChargeEnergy);

        // Set the new particle to current
        console.log(
          `${currentParticleIndex} : ${particlesList[currentParticleIndex].charge} --> ${nextParticleIndex} : ${particlesList[nextParticleIndex].charge}`
        );

        // Register a connection between the particles
        connectionsList.push(
          new ChargeConnection(
            particlesList[currentParticleIndex],
            particlesList[nextParticleIndex]
          )
        );

        currentParticleIndex = nextParticleIndex;
      } else {
        console.log(`path ended on ${currentParticleIndex}`);
        drawingComplete = true;
      }
    }

    // Draw the particles
    // for (let i = 0; i < n; i++) {
    //   particlesList[i].draw(context);
    // }

    // Draw the connections
    for (let i = 0; i < connectionsList.length; i++) {
      connectionsList[i].draw(context);
    }

    // Damp the particles
    for (let i = 0; i < n; i++) {
      particlesList[i].dampen();
    }
  };
};

canvasSketch(sketch, settings);
