import { generateId, generateIdString } from "./idGenerator";

console.log("Generating 10 IDs:");
for (let i = 0; i < 10; i++) {
  console.log(generateIdString());
}

const ids = new Set();
const count = 10000;
for (let i = 0; i < count; i++) {
  ids.add(generateIdString());
}

console.log(`Generated ${count} IDs, unique count: ${ids.size}`);
if (ids.size === count) {
  console.log("Uniqueness test passed!");
} else {
  console.log("Uniqueness test FAILED!");
}
