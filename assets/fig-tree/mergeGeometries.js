import { BufferAttribute, BufferGeometry } from "three";

export function mergeGeometries(geometries, useGroups = false) {
  if (!geometries || geometries.length === 0) return null;
  const isIndexed = geometries[0].index !== null;
  const attributesUsed = new Set(Object.keys(geometries[0].attributes));
  const attributes = {};
  const mergedGeometry = new BufferGeometry();
  let offset = 0;

  for (let i = 0; i < geometries.length; i++) {
    const geometry = geometries[i];
    let attributesCount = 0;
    for (const name in geometry.attributes) {
      if (!attributesUsed.has(name)) return null;
      if (attributes[name] === undefined) attributes[name] = [];
      attributes[name].push(geometry.attributes[name]);
      attributesCount++;
    }
    if (attributesCount !== attributesUsed.size) return null;
    if (isIndexed !== (geometry.index !== null)) return null;
    if (useGroups) {
      const count = isIndexed ? geometry.index.count : geometry.attributes.position.count;
      mergedGeometry.addGroup(offset, count, i);
      offset += count;
    }
  }

  if (isIndexed) {
    let indexOffset = 0;
    const mergedIndex = [];
    for (let i = 0; i < geometries.length; i++) {
      const index = geometries[i].index;
      for (let j = 0; j < index.count; j++) mergedIndex.push(index.getX(j) + indexOffset);
      indexOffset += geometries[i].attributes.position.count;
    }
    mergedGeometry.setIndex(mergedIndex);
  }

  for (const name in attributes) {
    const list = attributes[name];
    const itemSize = list[0].itemSize;
    const normalized = list[0].normalized;
    let count = 0;
    for (const attr of list) count += attr.count * itemSize;
    const array = new Float32Array(count);
    let cursor = 0;
    for (const attr of list) {
      array.set(attr.array, cursor);
      cursor += attr.count * itemSize;
    }
    mergedGeometry.setAttribute(name, new BufferAttribute(array, itemSize, normalized));
  }

  return mergedGeometry;
}
