const videoElement = document.getElementById("webcam");

const colorCanvas = document.getElementById("color");
const colorCanvasContext = colorCanvas.getContext("2d");

const bwCanvas = document.getElementById("black-and-white");
const bwCanvasContext = bwCanvas.getContext("2d");

const matrixCanvas = document.getElementById("matrix");
const matrixCanvasContext = matrixCanvas.getContext("2d");

// Start streaming from the webcam
async function startWebcam() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    videoElement.srcObject = stream;
  } catch (err) {
    console.error("Error accessing webcam:", err);
  }
}

function processFrame() {
  // Set the canvas dimensions to match video dimensions
  colorCanvas.width = videoElement.videoWidth;
  colorCanvas.height = videoElement.videoHeight;
  bwCanvas.width = videoElement.videoWidth;
  bwCanvas.height = videoElement.videoHeight;
  matrixCanvas.width = videoElement.videoWidth;
  matrixCanvas.height = videoElement.videoHeight;

  // Capture the video frame to the canvas
  colorCanvasContext.drawImage(
    videoElement,
    0,
    0,
    videoElement.videoWidth,
    videoElement.videoHeight
  );

  // Get the image data from the canvas
  const imageData = colorCanvasContext.getImageData(
    0,
    0,
    videoElement.videoWidth,
    videoElement.videoHeight
  );

  mutateToGrayscale(imageData);

  bwCanvasContext.putImageData(imageData, 0, 0);

  const grayscaleMatrix = getGrayscaleMatrix(imageData);
  drawGrayscaleMatrix(grayscaleMatrix, matrixCanvasContext);

  const centralLine = getCentralLine(grayscaleMatrix);
  drawCentralLine(centralLine, document.getElementById("central-line"));
}

startWebcam();

function mutateToGrayscale(imageData) {
  const data = imageData.data;

  for (let i = 0; i < data.length; i += 4) {
    // Calculate the grayscale value
    const gray = 0.3 * data[i] + 0.59 * data[i + 1] + 0.11 * data[i + 2];

    // Set the red, green, and blue data to the gray value
    data[i] = gray; // Red
    data[i + 1] = gray; // Green
    data[i + 2] = gray; // Blue
  }
}

function getGrayscaleMatrix(imageData) {
  const { height, width, data } = imageData;
  const result = [];

  for (let y = 0; y < height; y++) {
    const row = [];

    for (let x = 0; x < width; x++) {
      row.push(data[(y * width + x) * 4]);
    }

    result.push(row);
  }

  return result;
}

function drawGrayscaleMatrix(matrix, ctx) {
  for (let y = 0; y < matrix.length; y++) {
    for (let x = 0; x < matrix[y].length; x++) {
      const grayscale = matrix[y][x];
      const color = `rgb(${grayscale},${grayscale},${grayscale})`;

      ctx.fillStyle = color;
      ctx.fillRect(x, y, 1, 1);
    }
  }
}

function getCentralLine(matrix) {
  return matrix[Math.floor(matrix.length / 2)];
}

function drawCentralLine(points, canvas) {
  canvas.width = points.length;
  canvas.height = 100;
  const ctx = canvas.getContext("2d");

  for (let y = 0; y < canvas.height; y++) {
    for (let x = 0; x < points.length; x++) {
      const grayscale = points[x];
      const color = `rgb(${grayscale},${grayscale},${grayscale})`;

      ctx.fillStyle = color;
      ctx.fillRect(x, y, 1, 1);
    }
  }
}
