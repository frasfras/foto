import React, { useState, useRef, useEffect } from 'react';
import { Stage, Container, Bitmap, Rectangle, ColorMatrixFilter, ColorMatrix, Touch } from "createjs-module";
import { Button,LoadingIndicator, ColorSelector, MultilineInput, Rows, Text,Box, Slider,FileInput,FileInputItem ,Alert } from "@canva/app-ui-kit";
import { upload } from "@canva/asset";
import { addNativeElement } from "@canva/design";
import styles from "styles/components.css";
import flowers from "./flowers.png";
import  EditableInvoiceSVG from "./EditableInvoiceSVG";
import CanvaUploadWidget from "./CanvaUploadWidget";

export const App = () => {
  const onClick = () => {
    addNativeElement({
      type: "TEXT",
      children: ["Hello world!"],
    });
   
  };
  
  
    
  const canvasRef = useRef(null);
  const [canvasUrl, setCanvasUrl] = useState("");
  const [sliderValue, setSliderValue] = useState(25);
  const [image, setImage] = useState(flowers);
  const stageRef = useRef(null);
  const sliceContainerRef = useRef(null);
  const sliceWidthRef = useRef(0);
  const [isUploading, setIsUploading] = useState(false);
  const degToRad = Math.PI / 180;
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [preview,setPreview] = useState(true);
  let count=0;

  
  const handleDropAccepted1 = (files) => {
    setUploadedFiles(files);
    console.log('Uploaded files:', files);
    handleFileAccess(files[0]);
   
    setUploadedFiles([... uploadedFiles]);
  };

  const handleFileAccess = (file) => {
    // Example: Read file content
    const reader = new FileReader();
    reader.onload = (event) => {
      console.log('File content:', event.target.result);
      // Here you can perform operations with the file content
      // For example, you could send it to a server or process it further
      const img = new Image();
      img.src = event.target?.result;
       
      const thecanvas = canvasRef.current;
      const ctx = thecanvas.getContext('2d');

      //check dimension
      img.onload = () => {
       //  if(img.width > maxImageWidth || img.height > maxImageHeight){
       //    alert(`Image dimensions exceed the ${maxImageWidth}px x ${maxImageHeight}px limit. please upload a smaller image.`);
       //    return;
       //  }

         // Set canvas to a fixed 1:1 ratio
      const canvasSize = 400; // Set this to whatever size you want
      thecanvas.width = canvasSize;
      thecanvas.height = canvasSize;

      
      // ctx.drawImage(img, 0, 0, img.width * 1.15, img.height * 1.15);
       const canvas = canvasRef.current;
       canvas.width = img.width;
       canvas.height = img.height;
       
     setImage(event.target?.result);
    //  if(img.width < 750){
    //     canvas.width= 750;
    //     canvas.height=750;
    //     setSliderValue(2);
    //  }else{
     setSliderValue(2);
    //  }
    //  handleSliderChange(evt);
      };
    };
   
    reader.readAsDataURL(file);
  };

  const drawImageOnCanvas = () => {
    if (image && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');

      // Set canvas to a fixed 1:1 ratio
      const canvasSize = 400; // Set this to whatever size you want
      canvas.width = canvasSize;
      canvas.height = canvasSize;

      // Calculate how to fit the image inside the 1:1 area
      const imgAspectRatio = image.width / image.height;
      let drawWidth, drawHeight;

      if (imgAspectRatio > 1) {
        // Image is wider than tall, fit by width
        drawWidth = canvasSize;
        drawHeight = canvasSize / imgAspectRatio;
      } else {
        // Image is taller than wide, fit by height
        drawHeight = canvasSize;
        drawWidth = canvasSize * imgAspectRatio;
      }

      // Clear the canvas
      ctx.clearRect(0, 0, canvasSize, canvasSize);

      // Draw the image centered in the canvas
      const xOffset = (canvasSize - drawWidth) / 2;
      const yOffset = (canvasSize - drawHeight) / 2;
      ctx.drawImage(image, xOffset, yOffset, drawWidth, drawHeight);
    }
  };
  
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
    const stage = stageRef.current;

    let maxYOffset = 0; // to track how much space needed for top part of image

    //scale factor to fit folded witin canvas
    const scaleFactor = 0.75;

    for (let i = 0; i < l; i++) {
      const slice = sliceContainer.getChildAt(i);
      slice.scaleX = scaleFactor;
      slice.scaleY = scaleFactor;

      //calc new position with scale valu
      slice.y = ((Math.sin(value * degToRad) * -sliceWidth) / 2) * scaleFactor;
      if (i % 2) {
        slice.skewY = value * scaleFactor;
      } else {
        slice.skewY = -value * scaleFactor;
        slice.y -= sliceWidth * Math.sin(slice.skewY * degToRad) * scaleFactor;
      }
      slice.x = sliceWidth * (i - l / 2) * Math.cos(slice.skewY * degToRad) * scaleFactor;
      slice.filters[0].matrix.setColor(Math.sin(slice.skewY * degToRad) * -80);
      slice.updateCache();

      //track the max negative y offset to adjust canvas size
      if( slice.y <maxYOffset ){
        maxYOffset = slice.y;
      }
      if(maxYOffset < 0){
        sliceContainer.y = -maxYOffset;
      }
    }

    // Increse canvas height if necessary to fit folded image
    // if(maxYOffset < 0){
    //    stage.canvas.height = stage.canvas.height - maxYOffset;
    //   sliceContainer.y = -maxYOffset; //adjust slice container position;
    // }
    stage.update();
    // stageRef.current.update();
  }
  
  const fontOptions = [
    'Arial, sans-serif',
    'Helvetica, sans-serif',
    'Times New Roman, serif',
    'Courier New, monospace',
    'Georgia, serif',
    'Palatino, serif',
    'Garamond, serif',
    'Bookman, serif',
    'Comic Sans MS, cursive',
    'Trebuchet MS, sans-serif',
    'Arial Black, sans-serif'
  ];

  const generateSvgUrl = () => {
    const svgElement = canvasRef.current;
    if (svgElement) {
      const svgData = new XMLSerializer().serializeToString(svgElement);
      const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(svgBlob);
    //  setSvgUrl(url);
    }
  };

  const addToCanva = async () => {
    setIsUploading(true);
    try {
      const canvas = canvasRef.current;
      
      if (canvas) {
       // const svgData = new XMLSerializer().serializeToString(svgElement);
      //  const svgDataUrl = `data:image/svg+xml;base64,${btoa(svgData)}`;

      const dataUrl = canvas.toDataURL("image/png");
        // Upload the SVG to Canva
       

        const result = await upload({
          type: "IMAGE",
          mimeType: "image/png",
          url: dataUrl,
          thumbnailUrl:
            dataUrl,
        });

        // // Add the uploaded image to the Canva design
        await addNativeElement({
          type: "IMAGE",
          ref: result.ref,
        });

        alert("3D  successfully added to your Canva design!");
      }
    } catch (error) {
      console.error("Error adding to Canva:", error);
      alert("Failed to add  to Canva. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  function handleImageUpload(evt) {
    const file = evt.target.files[0];
    const maxImageWidth = 1920 ; // set max width 1920 px
    const maxImageHeight = 1080 ; // set max length 1080 px

    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
         const img = new Image();
         img.src = e.target?.result;
          
         //check dimension
         img.onload = () => {
          //  if(img.width > maxImageWidth || img.height > maxImageHeight){
          //    alert(`Image dimensions exceed the ${maxImageWidth}px x ${maxImageHeight}px limit. please upload a smaller image.`);
          //    return;
          //  }
         
          const canvas = canvasRef.current;
          canvas.width = img.width;
          canvas.height = img.height;
          
        setImage(e.target?.result);
         };
      };
      reader.readAsDataURL(file);
    }
  }
  function handleSaveCanvas() {
    const canvas = canvasRef.current;
    // const dataUrl = canvas.toDataURL("image/png");
    // setCanvasUrl(dataUrl);
  }

  function handleSliderChange(evt) {
    setSliderValue(evt.target.value);
  }
  
  const handleDropAccepted = (files) => {
    // setImage(files);
    const file = files[0];
    // console.log('uploaded files:', file);

    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
         const img = new Image();
         img.src = e.target?.result;
        // img.src= file;
        console.log(file);

         //check dimension
         img.onload = () => {
          //  if(img.width > maxImageWidth || img.height > maxImageHeight){
          //    alert(`Image dimensions exceed the ${maxImageWidth}px x ${maxImageHeight}px limit. please upload a smaller image.`);
          //    return;
          //  }
         
          const canvas = canvasRef.current;
          canvas.width = img.width;
          canvas.height = img.height;
          
        setImage(file);
         };
      };
      reader.readAsDataURL(file);
    }
  };
  
  const [previewFile, setPreviewFile] = useState(null);
  

 

  const handlePreview = (file) => {
    setPreviewFile(file);
  };

  const handleRemoveFile = (indexToRemove) => {
    setUploadedFiles(uploadedFiles.filter((_, index) => index !== indexToRemove));
    if (previewFile === uploadedFiles[indexToRemove]) {
      setPreviewFile(null);
    }
  };

  useEffect(() => {
    if (previewFile && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      const img = new Image();
     
      img.onload = () => {
        // Clear the canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Calculate dimensions to maintain aspect ratio
        const size = Math.min(img.width, img.height);
        const startX = (img.width - size) / 2;
        const startY = (img.height - size) / 2;

        // Draw the image
        ctx.drawImage(img, startX, startY, size, size, 0, 0, canvas.width, canvas.height);
      };

      img.src = URL.createObjectURL(previewFile);

      // Clean up
      return () => URL.revokeObjectURL(img.src);
    }
  }, [previewFile]);

  return (
    <div className={styles.scrollContainer}>
      <Rows spacing="2u">
        
        
        {/* <Button variant="primary" onClick={onClick} stretch>
          Do something cool
        </Button> */}
        <canvas ref={canvasRef} width="750" height="450"  />
        
        {/* <input type="range" min="0" max="50" value={sliderValue} onChange={handleSliderChange} style={{ width: "200px", marginTop: "20px" }} /> */}
        <FileInput
          accept={[
            'image/*'
          ]} 
          onDropAcceptedFiles={handleDropAccepted1}
        />
        <Text>    
          {/* To make changes to this app, edit the <code>src/app.tsx</code> file,
          then close and reopen the app in the editor to preview the changes. */}
          Accepted file formats: PNG JPG JPEG 
        </Text>
        <Text>
          Fold strength
        </Text>
        <Box paddingStart="2u">
          <Slider
            defaultValue={0}
            max={100}
            min={0}
            step={1}
            onChange={(value) => setSliderValue(value)}
          />
        </Box>
      <div style={{ textAlign: "center", marginTop: "20px" }}>
        {/* <input type="file" accept="image/*" onChange={handleImageUpload} /> */}
        {/* preview  */}
        {/* <img src={image} alt="preview" width="200" height="200"/> */}
        <br />
        {/* <button onClick={handleSaveCanvas} style={{ marginTop: "20px" }}>
          Save Canvas as URL
        </button> */}
      </div>
      {/*   <input
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        className="p-2 border border-gray-300 rounded w-full max-w-md"
        placeholder="Enter text"
      /> */}
       
       
       
      {/* <button
        onClick={generateSvgUrl}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
      >
        Generate SVG URL
      </button> */}
      
      {/* <button
          onClick={addToCanva}
          disabled={isUploading}
          style={{ color: 'white', backgroundColor: 'blue' }}
          className={`px-4 py-2 text-white rounded transition-colors ${
            isUploading ? 'bg-gray-400' : 'bg-green-500 hover:bg-green-600'
          }`}
        >
          {isUploading ? 'Adding to Canva...' : 'Add to Canva'}
        </button> */}
        
        <Button variant="primary" onClick={addToCanva} stretch loading={isUploading}>
        {isUploading ? '' : 'Add to design'}
        
        </Button>
      
      {/* {svgUrl && (
        <div className="w-full max-w-md">
          <p className="text-sm font-medium text-gray-700 mb-1">SVG URL:</p>
          <a
            href={svgUrl}
            download="3d-text.svg"
            className="block w-full p-2 bg-gray-100 border border-gray-300 rounded text-blue-600 hover:text-blue-800 overflow-hidden text-ellipsis whitespace-nowrap"
          >
            {svgUrl}
          </a>
        </div>
      )} */}
      {uploadedFiles.length > 0 && (
        <div className="mt-4">
          <h3 className="text-md font-semibold mb-2">Uploaded Files:</h3>
          <ul className="space-y-2">
            {uploadedFiles.map((file, index) => (
              <li key={index} className="flex items-center justify-between p-2 bg-gray-100 rounded">
                <span className="text-lg text-gray-600">{file.name}</span>
                <div>
                  <button
                    onClick={() => handleFileAccess(file)}
                    className="mr-2 p-1 text-blue-500 hover:text-blue-700"
                  >
                  {file.name}  
                  </button>
                  {/* <FileInputItem 
                  label= {file.name}
                  onDeleteClick={() => handleFileAccess(file)}
                  /> */}
                   <button
                    onClick={() => handlePreview(file)}
                    className="mr-2 p-1 text-blue-500 hover:text-blue-700"
                  >
                    {/* <FileText size={16} /> */}
                    preview
                  </button>
                  <button
                    onClick={() => handleRemoveFile(index)}
                    className="p-1 text-red-500 hover:text-red-700"
                  >
                    &times;
                  </button>
                </div>
              </li>
            ))}
          </ul>
          {previewFile && (
        <div className="mt-4">
          <h3 className="text-md font-semibold mb-2">Preview:</h3>
          <div className="relative w-64 h-64">
            <canvas ref={canvasRef} width={256} height={256} className="w-full h-full" />
          </div>
        </div>
      )}
        </div>
      )}
    
      </Rows>
    </div>
  );
};
