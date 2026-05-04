declare module "exif-js" {
  const EXIF: {
    getData: (img: HTMLImageElement, callback: () => void) => void;
    getAllTags: (img: HTMLImageElement) => Record<string, unknown>;
  };

  export default EXIF;
}

