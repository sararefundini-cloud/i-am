const T = window.T;

export const Vector2 = T.Vector2;
export const Vector3 = T.Vector;
export const Matrix4 = T.Matrix4;
export const Color = T.Color;
export const Box3 = T.Box3;
export const BufferGeometry = T.BufferGeometry;
export const BufferAttribute = T.BufferAttribute;
export const Float32BufferAttribute = T.FloatAttr;
export const InstancedMesh = T.Instanced;
export const Mesh = T.Mesh;
export const Group = T.Group;
export const MeshStandardMaterial = T.Material;
export const PlaneGeometry = T.Plane;
export const CatmullRomCurve3 = T.Catmull;
export const DoubleSide = 2;
export const RepeatWrapping = 1000;
export const ClampToEdgeWrapping = 1001;
export const SRGBColorSpace = "srgb";
export const LinearSRGBColorSpace = "srgb-linear";

export class TextureLoader {
  load(url, onLoad, _onProgress, onError) {
    const image = new Image();
    const texture = new T.Texture(image);
    image.onload = () => {
      texture.needsUpdate = true;
      if (onLoad) onLoad(texture);
    };
    image.onerror = () => {
      const err = new Error("Texture failed: " + url);
      if (onError) onError(err);
    };
    image.src = url;
    return texture;
  }
}
