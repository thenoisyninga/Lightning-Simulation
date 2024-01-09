const canvasSketch = require("canvas-sketch");
const { squaredDistance } = require("canvas-sketch-util/lib/vec2");
const math = require("canvas-sketch-util/math");
const random = require("canvas-sketch-util/random");

let width = 2048;
let height = 2048;

let n = 5000;
let spreadDistance = width / 10;
let angleSpread = 45;
let size = 10;
let dampingFactor = 1;
let energyLossPerTransfer = 0.05;
let maxEnergy = 100;
let energyDirection = random.range(0, Math.PI);

const settings = {
  dimensions: [width, height],
  animate: true,
  fps: 120,
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

class ChargedParticle {
  constructor(pos, dampingFactor) {
    this.pos = pos;
    this.dampingFactor = dampingFactor;
    this.energyVector = new Vector2D(0, 0);
    this.size = size;
  }

  dampen() {
    this.energyVector = this.energyVector.multiply(this.dampingFactor);
  }

  charge(nextChargeEnergy) {
    this.energyVector.add(nextChargeEnergy);

    if (this.energyVector.magnitude() > 100) {
      this.energyVector = new Vector2D(
        (this.energyVector.x / this.energyVector.x) * 100,
        (this.energyVector.y / this.energyVector.y) * 100
      );
    }
  }

  draw(context) {
    let colorWeight = this.energyVector.magnitude() / 100;

    context.save();
    context.beginPath();
    context.translate(this.pos.x, this.pos.y);
    context.lineWidth = 1;
    context.strokeStyle = `rgba(256, 256, 256, ${colorWeight})`;
    context.fillStyle = `rgba(256, 256, 256, ${colorWeight})`;

    // if (this.energyVector.magnitude() == 0) {
    //   context.fillStyle = "red";
    //   context.strokeStyle = "red";
    // } else {
    //   context.fillStyle = `rgb(${colorWeight}, ${colorWeight}, ${colorWeight})`;
    //   context.strokeStyle = `rgb(${colorWeight}, ${colorWeight}, ${colorWeight})`;
    // }

    context.arc(0, 0, Math.abs(this.size / 2), 0, Math.PI * 2.0);
    context.stroke();
    context.fill();
    context.restore();
  }
}

const sketch = ({ context, width, height }) => {
  // Run on start
  let particlesList = [];
  let visitedParticlesList = [];

  let currentParticleIndex = 0;
  let nextParticleIndex = -1;

  let currentParticle = particlesList[currentParticleIndex];

  function isVisited(particleIndex) {
    let visited = false;
    for (let i = 0; i < visitedParticlesList.length; i++) {
      if (visitedParticlesList[i] == particleIndex) {
        visited = true;
        break;
      }
    }
    return visited;
  }

  function getNearbyParticle(currentParticleIndexP) {
    let currParticle = particlesList[currentParticleIndexP];
    let result = -1;

    for (let i = 0; i < n; i++) {
      let nextParticle = particlesList[i];

      let angleToNext = Math.atan(
        (currParticle.pos.x - nextParticle.pos.x) /
          (currParticle.pos.y - nextParticle.pos.y)
      );

      let angleDifference =
        ((angleToNext - currParticle.energyVector.direction()) / Math.PI) * 180;

      particleDistance = Math.sqrt(
        Math.pow(currParticle.pos.x - nextParticle.pos.x, 2) +
          Math.pow(currParticle.pos.y - nextParticle.pos.y, 2)
      );

      if (
        // The next particle is close enough
        particleDistance < spreadDistance &&
        // checking if already visited
        !isVisited(i)
        // the particle is in the direction of the energy possessed
        // &&
        // Math.abs(angleDifference) <= angleSpread
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

  particlesList[currentParticleIndex].energyVector = new Vector2D(
    maxEnergy * Math.cos(energyDirection),
    maxEnergy * Math.sin(energyDirection)
  );
  visitedParticlesList.push(currentParticleIndex);

  // Run on each frame
  return ({ context, width, height }) => {
    context.fillStyle = "black";
    context.fillRect(0, 0, width, height);

    // Select a nearby particle
    nextParticleIndex = getNearbyParticle(currentParticleIndex);
    console.log(`Marking ${nextParticleIndex} as visited.`);
    visitedParticlesList.push(nextParticleIndex);

    if (nextParticleIndex >= 0) {
      // Charge the nearby particle accordingly
      let nextChargeEnergy = particlesList[
        currentParticleIndex
      ].energyVector.multiply(1 - energyLossPerTransfer);

      particlesList[nextParticleIndex].charge(nextChargeEnergy);

      // Set the new particle to current
      console.log(
        `${currentParticleIndex} : ${particlesList[
          currentParticleIndex
        ].energyVector.magnitude()} --> ${nextParticleIndex} : ${particlesList[
          nextParticleIndex
        ].energyVector.magnitude()}`
      );

      currentParticleIndex = nextParticleIndex;
    } else {
      console.log(`path ended on ${currentParticleIndex}`);
    }

    // Draw the particles
    for (let i = 0; i < n; i++) {
      particlesList[i].draw(context);
    }

    // Damp the particles
    for (let i = 0; i < n; i++) {
      particlesList[i].dampen();
    }
  };
};

canvasSketch(sketch, settings);
