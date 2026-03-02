import Matter from 'matter-js'

const { Engine, World, Bodies, Body } = Matter

// ── Types ──

export interface PhysicsWorld {
  engine: Matter.Engine
  walls: Matter.Body[]
  stones: Matter.Body[]
  width: number
  height: number
}

export interface StonePosition {
  id: number
  x: number
  y: number
  angle: number
  velocityY: number
}

// ── Constants ──

const STONE_RADIUS = 14
const WALL_THICKNESS = 40
const RESTITUTION = 0.5
const FRICTION = 0.3
const AIR_FRICTION = 0.01

// ── World Management ──

export function createPhysicsWorld(
  width: number,
  height: number,
  stoneCount: number,
): PhysicsWorld {
  const engine = Engine.create({
    gravity: { x: 0, y: 1, scale: 0.001 },
  })

  // Walls: floor, left, right, top
  const floor = Bodies.rectangle(width / 2, height + WALL_THICKNESS / 2, width + 100, WALL_THICKNESS, {
    isStatic: true,
    restitution: RESTITUTION,
    label: 'floor',
  })
  const left = Bodies.rectangle(-WALL_THICKNESS / 2, height / 2, WALL_THICKNESS, height + 100, {
    isStatic: true,
    label: 'wall-left',
  })
  const right = Bodies.rectangle(width + WALL_THICKNESS / 2, height / 2, WALL_THICKNESS, height + 100, {
    isStatic: true,
    label: 'wall-right',
  })
  const top = Bodies.rectangle(width / 2, -WALL_THICKNESS / 2, width + 100, WALL_THICKNESS, {
    isStatic: true,
    label: 'wall-top',
  })

  const walls = [floor, left, right, top]

  // Create stone bodies
  const stones: Matter.Body[] = []
  for (let i = 0; i < stoneCount; i++) {
    const stone = Bodies.circle(
      width * 0.3 + (i * width * 0.1),
      height * 0.6,
      STONE_RADIUS,
      {
        restitution: RESTITUTION,
        friction: FRICTION,
        frictionAir: AIR_FRICTION,
        label: `stone-${i}`,
        density: 0.002,
      },
    )
    stones.push(stone)
  }

  World.add(engine.world, [...walls, ...stones])

  return { engine, walls, stones, width, height }
}

export function updatePhysics(world: PhysicsWorld, delta: number = 16.67): void {
  Engine.update(world.engine, delta)
}

export function getStonePositions(world: PhysicsWorld): StonePosition[] {
  return world.stones.map((stone, i) => ({
    id: i,
    x: stone.position.x,
    y: stone.position.y,
    angle: stone.angle,
    velocityY: stone.velocity.y,
  }))
}

// ── Forces ──

export function applyTossForce(world: PhysicsWorld, stoneIndex: number, velocityX: number, velocityY: number): void {
  const stone = world.stones[stoneIndex]
  if (!stone) return
  Body.setVelocity(stone, { x: velocityX, y: velocityY })
}

export function applyScatterForce(world: PhysicsWorld, rng: () => number): void {
  for (const stone of world.stones) {
    const fx = (rng() - 0.5) * 0.01
    const fy = -(rng() * 0.005 + 0.002)
    Body.applyForce(stone, stone.position, { x: fx, y: fy })
  }
}

export function applyCatSwipeForce(world: PhysicsWorld, direction: 'left' | 'right' | 'top'): void {
  const force = 0.012
  for (const stone of world.stones) {
    let fx = 0
    let fy = 0
    switch (direction) {
      case 'left':
        fx = -force
        fy = -(Math.random() * 0.005)
        break
      case 'right':
        fx = force
        fy = -(Math.random() * 0.005)
        break
      case 'top':
        fx = (Math.random() - 0.5) * force
        fy = -force
        break
    }
    Body.applyForce(stone, stone.position, { x: fx, y: fy })
  }
}

export function applyFleeForce(
  world: PhysicsWorld,
  stoneIds: number[],
  pointerX: number,
  pointerY: number,
): void {
  const fleeStrength = 0.004
  for (const id of stoneIds) {
    const stone = world.stones[id]
    if (!stone) continue
    const dx = stone.position.x - pointerX
    const dy = stone.position.y - pointerY
    const dist = Math.sqrt(dx * dx + dy * dy) || 1
    Body.applyForce(stone, stone.position, {
      x: (dx / dist) * fleeStrength,
      y: (dy / dist) * fleeStrength,
    })
  }
}

export function setStonePosition(
  world: PhysicsWorld,
  stoneIndex: number,
  x: number,
  y: number,
): void {
  const stone = world.stones[stoneIndex]
  if (!stone) return
  Body.setPosition(stone, { x, y })
  Body.setVelocity(stone, { x: 0, y: 0 })
}

export function setStoneStatic(world: PhysicsWorld, stoneIndex: number, isStatic: boolean): void {
  const stone = world.stones[stoneIndex]
  if (!stone) return
  Body.setStatic(stone, isStatic)
}

export function destroyPhysicsWorld(world: PhysicsWorld): void {
  World.clear(world.engine.world, false)
  Engine.clear(world.engine)
}
