import React, { useEffect, useRef, useState } from "react";
import { Stage, Container, Bitmap, Rectangle, ColorMatrixFilter, ColorMatrix, Touch } from "createjs-module";
import "./App.css";
// import { upload } from "@canva/asset";
// import { addNativeElement } from "@canva/design";
import flowers from "./flowers.jpg"; // Assume the image is in the src folder
//import EditableInvoiceSVG from "./EditableInvoiceSVG";
import CanvaUploadWidget from "./CanvaUploadWidget";

function App() {
  const canvasRef = useRef(null);
  const [canvasUrl, setCanvasUrl] = useState("");
  const [sliderValue, setSliderValue] = useState(25);
  const [image, setImage] = useState(flowers);
  const stageRef = useRef(null);
  const sliceContainerRef = useRef(null);
  const sliceWidthRef = useRef(null);
  const [isUploading, setIsUploading] = useState(false);
  const degToRad = Math.PI / 180;

  useEffect(() => {
    if (!image) return;

    const stage = new Stage(canvasRef.current);
    stageRef.current = stage;
    stage.enableMouseOver();
    Touch.enable(stage);
    stage.mouseMoveOutside = true;

    const img = new Image();
    img.onload = handleImageLoad;
    img.src = image;

    function handleImageLoad(evt) {
      const img = evt.target;
      const imgWidth = img.width;
      const imgHeight = img.height;
      const sliceCount = 6;
      sliceWidthRef.current = imgWidth / sliceCount;
      const sliceContainer = new Container();
      sliceContainer.x = stage.canvas.width / 2;
      sliceContainerRef.current = sliceContainer;

      for (let i = 0; i < sliceCount; i++) {
        const slice = new Bitmap(img);
        slice.sourceRect = new Rectangle(sliceWidthRef.current * i, 0, sliceWidthRef.current, imgHeight);
        slice.cache(0, 0, sliceWidthRef.current, imgHeight);
        slice.filters = [new ColorMatrixFilter(new ColorMatrix())];
        sliceContainer.addChild(slice);
      }

      stage.addChild(sliceContainer);
      updateEffect(sliderValue);
    }
  }, [sliderValue]);

  useEffect(() => {
    updateEffect(sliderValue);
  }, [sliderValue]);

  function updateEffect(value) {
    const sliceContainer = sliceContainerRef.current;
    const sliceWidth = sliceWidthRef.current;
    if (!sliceContainer || sliceWidth === null) return;

    const l = sliceContainer.numChildren;
    for (let i = 0; i < l; i++) {
      const slice = sliceContainer.getChildAt(i);
      slice.y = (Math.sin(value * degToRad) * -sliceWidth) / 2;
      if (i % 2) {
        slice.skewY = value;
      } else {
        slice.skewY = -value;
        slice.y -= sliceWidth * Math.sin(slice.skewY * degToRad);
      }
      slice.x = sliceWidth * (i - l / 2) * Math.cos(slice.skewY * degToRad);
      slice.filters[0].matrix.setColor(Math.sin(slice.skewY * degToRad) * -80);
      slice.updateCache();
    }
    stageRef.current.update();
  }

  function handleSliderChange(evt) {
    setSliderValue(evt.target.value);
  }

  function handleSaveCanvas() {
    const canvas = canvasRef.current;
    const dataUrl = canvas.toDataURL("image/png");
    setCanvasUrl(dataUrl);
  }

  const addToCanva = async () => {
    setIsUploading(true);
    try {
      // const svgElement = svgRef.current;
      const canvas = canvasRef.current;
      if (canvas) {
        // const svgData = new XMLSerializer().serializeToString(svgElement);
        // const svgDataUrl = `data:image/svg+xml;base64,${btoa(svgData)}`;
        const dataUrl = canvas.toDataURL("image/png");
        // Upload the SVG to Canva
        // const result = await upload({
        //   type: "IMAGE",
        //   mimeType: "image/svg+xml",
        //   url: dataUrl,
        // });

        // Add the uploaded image to the Canva design
        // await addNativeElement({
        //   type: "IMAGE",
        //   ref: result.ref,
        // });
        setCanvasUrl(dataUrl);
        alert("3D successfully added to your Canva design!");
      }
    } catch (error) {
      console.error("Error adding to Canva:", error);
      alert("Failed to add 3D Text to Canva. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  function handleImageUpload(evt) {
    const file = evt.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setImage(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  }

  return (
    <div >
      <canvas ref={canvasRef} width="550" height="400" />
      <br />
      <input type="range" min="0" max="50" value={sliderValue} onChange={handleSliderChange} style={{ width: "200px", marginTop: "20px" }} />
      <div style={{ textAlign: "center", marginTop: "20px" }}>
        <input type="file" accept="image/*" onChange={handleImageUpload} />
        <br />
        <button onClick={handleSaveCanvas} style={{ marginTop: "20px" }}>
          Save Canvas as URL
        </button>
      </div>
      {canvasUrl && (
        <div>
          <h3>Canvas Data URL:</h3>
          <textarea readOnly value={canvasUrl} rows={5} cols={50} />
          <a href={canvasUrl} download="canvas-image.png">
            Download Image
          </a>
        </div>
      )}
      <CanvaUploadWidget />
    </div>
  );
}

export default App;
