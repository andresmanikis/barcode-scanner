const videoElement = document.getElementById("webcam");
const imgElement = document.getElementById("image");

const colorCanvas = document.getElementById("color");
const colorCanvasContext = colorCanvas.getContext("2d");

const bwCanvas = document.getElementById("black-and-white");
const bwCanvasContext = bwCanvas.getContext("2d");

const matrixCanvas = document.getElementById("matrix");
const matrixCanvasContext = matrixCanvas.getContext("2d");

// startWebcam();
processFrame();

async function startWebcam() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    videoElement.srcObject = stream;
  } catch (err) {
    alert("Error accessing webcam:" + err.message);
  }
}

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

function drawGrayscaleMatrix(matrix, canvas) {
  canvas.height = matrix.length;
  canvas.width = matrix[0].length;
  const ctx = canvas.getContext("2d");

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

function drawPoints(points, canvas) {
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

function getAbsDerivative(points) {
  const result = [0];

  for (let i = 1; i < points.length; i++) {
    result.push(Math.abs(points[i] - points[i - 1]));
  }

  return result;
}

function drawGraph(points, canvas) {
  canvas.width = points.length;
  canvas.height = 300;
  const ctx = canvas.getContext("2d");

  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "green";

  for (let x = 0; x < points.length; x++) {
    ctx.fillRect(x, 300 - points[x], 1, 1);
  }
}

function smooth3(points) {
  const result = [];

  result.push(points[0]);

  for (let i = 1; i < points.length - 1; i++) {
    const avg = (points[i - 1] + points[i] + points[i + 1]) / 3;
    result.push(avg);
  }

  result.push(points[points.length - 1]);

  return result;
}

function smooth5(points) {
  const result = [];

  result.push(points[0]);
  result.push(points[1]);

  for (let i = 2; i < points.length - 2; i++) {
    const avg =
      (points[i - 2] +
        points[i - 1] +
        points[i] +
        points[i + 1] +
        points[i + 2]) /
      5;

    result.push(avg);
  }

  result.push(points[points.length - 2]);
  result.push(points[points.length - 1]);

  return result;
}

function treshold(points, t) {
  return points.map((p) => (p >= t ? 1 : 0));
}

function drawEdges(edges, canvas) {
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "green";

  for (let x = 0; x < edges.length; x++) {
    if (edges[x] > 0) {
      ctx.fillRect(x, 0, 1, canvas.height / 2);
    }
  }
}

function processFrame() {
  colorCanvas.width = imgElement.width;
  colorCanvas.height = imgElement.height;
  bwCanvas.width = imgElement.width;
  bwCanvas.height = imgElement.height;

  colorCanvasContext.drawImage(
    imgElement,
    0,
    0,
    imgElement.width,
    imgElement.height
  );

  const imageData = colorCanvasContext.getImageData(
    0,
    0,
    imgElement.width,
    imgElement.height
  );

  mutateToGrayscale(imageData);

  bwCanvasContext.putImageData(imageData, 0, 0);

  const grayscaleMatrix = getGrayscaleMatrix(imageData);
  // drawGrayscaleMatrix(grayscaleMatrix, matrixCanvas);

  const centralLine = getCentralLine(grayscaleMatrix);
  // drawPoints(centralLine, document.getElementById("central-line"));

  const smoothCentralLine = smooth5(centralLine);
  // drawPoints(smoothCentralLine, document.getElementById("smooth"));

  const absDerivative = getAbsDerivative(smoothCentralLine);
  drawGraph(absDerivative, document.getElementById("abs-derivative"));

  const absDerivativeWithTreshold = treshold(absDerivative, 20);
  drawGraph(
    absDerivativeWithTreshold.map((p) => p * 100),
    document.getElementById("abs-derivative-treshold")
  );

  drawPoints(smoothCentralLine, document.getElementById("edges"));
  drawEdges(absDerivativeWithTreshold, document.getElementById("edges"));
}
