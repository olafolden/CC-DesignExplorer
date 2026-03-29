// Run with: npx tsx scripts/generate-test-glb.ts
import * as fs from 'fs'
import * as path from 'path'

// Minimal GLB file containing a single cube mesh
// GLB = 12-byte header + JSON chunk + BIN chunk

// --- Geometry: unit cube ---
// 8 vertices, 12 triangles (6 faces × 2 tris)
const positions = new Float32Array([
  // front
  -0.5, -0.5,  0.5,   0.5, -0.5,  0.5,   0.5,  0.5,  0.5,  -0.5,  0.5,  0.5,
  // back
  -0.5, -0.5, -0.5,  -0.5,  0.5, -0.5,   0.5,  0.5, -0.5,   0.5, -0.5, -0.5,
  // top
  -0.5,  0.5, -0.5,  -0.5,  0.5,  0.5,   0.5,  0.5,  0.5,   0.5,  0.5, -0.5,
  // bottom
  -0.5, -0.5, -0.5,   0.5, -0.5, -0.5,   0.5, -0.5,  0.5,  -0.5, -0.5,  0.5,
  // right
   0.5, -0.5, -0.5,   0.5,  0.5, -0.5,   0.5,  0.5,  0.5,   0.5, -0.5,  0.5,
  // left
  -0.5, -0.5, -0.5,  -0.5, -0.5,  0.5,  -0.5,  0.5,  0.5,  -0.5,  0.5, -0.5,
])

const normals = new Float32Array([
  // front
  0, 0, 1,  0, 0, 1,  0, 0, 1,  0, 0, 1,
  // back
  0, 0,-1,  0, 0,-1,  0, 0,-1,  0, 0,-1,
  // top
  0, 1, 0,  0, 1, 0,  0, 1, 0,  0, 1, 0,
  // bottom
  0,-1, 0,  0,-1, 0,  0,-1, 0,  0,-1, 0,
  // right
  1, 0, 0,  1, 0, 0,  1, 0, 0,  1, 0, 0,
  // left
 -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0,
])

const indices = new Uint16Array([
   0, 1, 2,   0, 2, 3,   // front
   4, 5, 6,   4, 6, 7,   // back
   8, 9,10,   8,10,11,   // top
  12,13,14,  12,14,15,   // bottom
  16,17,18,  16,18,19,   // right
  20,21,22,  20,22,23,   // left
])

// Binary buffer: indices + positions + normals
const indicesBytes = Buffer.from(indices.buffer)
const positionsBytes = Buffer.from(positions.buffer)
const normalsBytes = Buffer.from(normals.buffer)

const binBuffer = Buffer.concat([indicesBytes, positionsBytes, normalsBytes])

// Pad binary to 4-byte alignment
const binPadding = (4 - (binBuffer.length % 4)) % 4
const paddedBin = Buffer.concat([binBuffer, Buffer.alloc(binPadding)])

const indicesOffset = 0
const indicesLength = indicesBytes.length
const positionsOffset = indicesLength
const positionsLength = positionsBytes.length
const normalsOffset = positionsOffset + positionsLength
const normalsLength = normalsBytes.length

// glTF JSON
const gltf = {
  asset: { version: '2.0', generator: 'design-explorer-test' },
  scene: 0,
  scenes: [{ nodes: [0] }],
  nodes: [{ mesh: 0, name: 'Cube' }],
  meshes: [{
    primitives: [{
      attributes: { POSITION: 1, NORMAL: 2 },
      indices: 0,
      material: 0,
    }],
  }],
  materials: [{
    pbrMetallicRoughness: {
      baseColorFactor: [0.7, 0.7, 0.7, 1.0],
      metallicFactor: 0.1,
      roughnessFactor: 0.8,
    },
  }],
  accessors: [
    { bufferView: 0, componentType: 5123, count: indices.length, type: 'SCALAR', max: [23], min: [0] },
    { bufferView: 1, componentType: 5126, count: 24, type: 'VEC3', max: [0.5, 0.5, 0.5], min: [-0.5, -0.5, -0.5] },
    { bufferView: 2, componentType: 5126, count: 24, type: 'VEC3', max: [1, 1, 1], min: [-1, -1, -1] },
  ],
  bufferViews: [
    { buffer: 0, byteOffset: indicesOffset, byteLength: indicesLength, target: 34963 },
    { buffer: 0, byteOffset: positionsOffset, byteLength: positionsLength, target: 34962 },
    { buffer: 0, byteOffset: normalsOffset, byteLength: normalsLength, target: 34962 },
  ],
  buffers: [{ byteLength: paddedBin.length }],
}

const jsonStr = JSON.stringify(gltf)
// Pad JSON to 4-byte alignment with spaces
const jsonPadding = (4 - (jsonStr.length % 4)) % 4
const paddedJson = jsonStr + ' '.repeat(jsonPadding)
const jsonBuffer = Buffer.from(paddedJson, 'utf8')

// GLB structure
const GLB_MAGIC = 0x46546C67
const GLB_VERSION = 2
const JSON_CHUNK_TYPE = 0x4E4F534A
const BIN_CHUNK_TYPE = 0x004E4942

const headerSize = 12
const jsonChunkSize = 8 + jsonBuffer.length
const binChunkSize = 8 + paddedBin.length
const totalSize = headerSize + jsonChunkSize + binChunkSize

const glb = Buffer.alloc(totalSize)
let offset = 0

// Header
glb.writeUInt32LE(GLB_MAGIC, offset); offset += 4
glb.writeUInt32LE(GLB_VERSION, offset); offset += 4
glb.writeUInt32LE(totalSize, offset); offset += 4

// JSON chunk
glb.writeUInt32LE(jsonBuffer.length, offset); offset += 4
glb.writeUInt32LE(JSON_CHUNK_TYPE, offset); offset += 4
jsonBuffer.copy(glb, offset); offset += jsonBuffer.length

// BIN chunk
glb.writeUInt32LE(paddedBin.length, offset); offset += 4
glb.writeUInt32LE(BIN_CHUNK_TYPE, offset); offset += 4
paddedBin.copy(glb, offset)

const outPath = path.join(import.meta.dirname, '..', 'test-data', 'design_0.glb')
fs.writeFileSync(outPath, glb)
console.log(`Written ${totalSize} bytes to ${outPath}`)
