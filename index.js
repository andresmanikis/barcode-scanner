const videoElement = document.getElementById("webcam");
const imgElement = document.getElementById("image");

const bwCanvas = document.getElementById("black-and-white");
const bwCanvasContext = bwCanvas.getContext("2d");

const matrixCanvas = document.getElementById("matrix");
const matrixCanvasContext = matrixCanvas.getContext("2d");

// startWebcam();

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

function getDerivative(points) {
  const result = [0];

  for (let i = 1; i < points.length; i++) {
    result.push(points[i] - points[i - 1]);
  }

  return result;
}

function drawGraph(points, canvas) {
  canvas.width = points.length;
  canvas.height = 300;
  const ctx = canvas.getContext("2d");

  ctx.fillRect(0, 0, canvas.width, canvas.height);

  for (let x = 0; x < points.length; x++) {
    if (points[x] >= 0) {
      ctx.fillStyle = "green";
      ctx.fillRect(x, 300 - points[x], 1, 1);
    } else {
      ctx.fillStyle = "red";
      ctx.fillRect(x, 300 + points[x], 1, 1);
    }
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

function absTreshold(points, t) {
  return points.map((p) => {
    if (Math.abs(p) > t) {
      return p > 0 ? -1 : 1;
    } else {
      return 0;
    }
  });
}

function drawEdges(edges, canvas) {
  const ctx = canvas.getContext("2d");

  for (let x = 0; x < edges.length; x++) {
    if (edges[x] === 0) continue;

    if (edges[x] > 0) {
      ctx.fillStyle = "green";
    } else if (edges[x] < 0) {
      ctx.fillStyle = "red";
    }

    ctx.fillRect(x, 0, 1, canvas.height / 2);
  }
}

function normalise(points) {
  const max = Math.max(...points.map((p) => Math.abs(p)));
  return points.map((p) => (p / max) * 100);
}

function getBarWidths(edges) {
  const result = [];

  let barStart = -1;
  let currentBar = "NONE";

  for (let i = 0; i < edges.length; i++) {
    const e = edges[i];

    if (e === 0) continue;

    if (currentBar === "NONE") {
      if (e === 1) {
        currentBar = "BLACK";
      } else {
        currentBar = "WHITE";
      }

      barStart = i;
    } else if (currentBar === "BLACK") {
      if (e === -1) {
        currentBar = "WHITE";
        result.push({ color: "BLACK", width: i - barStart });
        barStart = i;
      }
    } else if (currentBar === "WHITE") {
      if (e === 1) {
        currentBar = "BLACK";
        result.push({ color: "WHITE", width: i - barStart });
        barStart = i;
      }
    }
  }

  return result;
}

function drawCalculated(widths) {
  const canvas = document.getElementById("calculated");
  const ctx = canvas.getContext("2d");

  const totalWidth = widths.reduce((acc, w) => acc + w.width, 0);

  canvas.width = totalWidth;
  canvas.height = 100;

  let currentX = 0;
  widths.forEach((w) => {
    if (w.color === "BLACK") {
      ctx.fillStyle = "black";
    } else {
      ctx.fillStyle = "white";
    }

    ctx.fillRect(currentX, 0, w.width, canvas.height);
    currentX += w.width;
  });
}

function areVerySimilar(w1, w2) {
  return Math.abs(1 - w1 / w2) < 0.3;
}

function findStart(widths) {
  for (let i = 2; i < widths.length; i++) {
    const w1 = widths[i - 2].width;
    const w2 = widths[i - 1].width;
    const w3 = widths[i].width;

    if (!areVerySimilar(w1, w2)) continue;
    if (!areVerySimilar(w2, w3)) continue;

    return i - 2;
  }
}

function getSegments(widths) {
  const result = [];

  const start = findStart(widths);

  let currentBar = start + 3; // Skip the start bars

  push6Numbers();

  currentBar += 5; // Skip the center bars

  push6Numbers();

  return result;

  function push6Numbers() {
    for (let i = 0; i < 6; i++) {
      const segment = [];

      for (let j = 0; j < 4; j++) {
        segment.push(widths[currentBar]);
        currentBar++;
      }

      result.push(segment);
    }
  }
}

function processFrame() {
  const colorCanvas = document.getElementById("color");
  const colorCanvasContext = colorCanvas.getContext("2d");

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

  const smoothCentralLine = centralLine;
  // drawPoints(smoothCentralLine, document.getElementById("smooth"));

  const derivative = normalise(getDerivative(smoothCentralLine));
  drawGraph(derivative, document.getElementById("derivative"));

  const derivativeWithAbsTreshold = absTreshold(derivative, 20);
  drawGraph(
    derivativeWithAbsTreshold.map((p) => p * 100),
    document.getElementById("derivative-abs-treshold")
  );

  drawPoints(smoothCentralLine, document.getElementById("edges"));
  drawEdges(derivativeWithAbsTreshold, document.getElementById("edges"));

  const barWidths = getBarWidths(derivativeWithAbsTreshold);

  console.log("Bar widths", barWidths);

  drawCalculated(barWidths);

  const segments = getSegments(barWidths);
  console.log(segments);

  drawOneNumber(segments[0]);
}

processFrame();
