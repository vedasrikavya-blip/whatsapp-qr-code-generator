export function createQrMatrix(value, qrFactory = globalThis.qrcode) {
  if (typeof qrFactory !== 'function') {
    throw new Error('QR code generator is not available.');
  }

  const qr = qrFactory(0, 'M');
  qr.addData(String(value));
  qr.make();

  const count = qr.getModuleCount();
  return Array.from({ length: count }, (_, row) =>
    Array.from({ length: count }, (_, col) => Boolean(qr.isDark(row, col)))
  );
}

export function matrixToSvg(matrix, options = {}) {
  const margin = Number.isFinite(options.margin) ? options.margin : 4;
  const foreground = options.foreground || '#000000';
  const background = options.background || '#ffffff';
  const count = matrix.length;
  const dimension = count + margin * 2;
  const cells = [];

  for (let row = 0; row < count; row += 1) {
    for (let col = 0; col < count; col += 1) {
      if (matrix[row][col]) {
        cells.push(`<rect x="${col + margin}" y="${row + margin}" width="1" height="1"/>`);
      }
    }
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${dimension} ${dimension}" shape-rendering="crispEdges" role="img" aria-label="WhatsApp QR code"><rect width="100%" height="100%" fill="${background}"/><g fill="${foreground}">${cells.join('')}</g></svg>`;
}

export function drawMatrixToCanvas(matrix, canvas, options = {}) {
  const size = Number.isFinite(options.size) ? options.size : 1024;
  const margin = Number.isFinite(options.margin) ? options.margin : 4;
  const foreground = options.foreground || '#000000';
  const background = options.background || '#ffffff';
  const count = matrix.length;
  const fullCount = count + margin * 2;
  const moduleSize = size / fullCount;
  const context = canvas.getContext('2d');

  if (!context) throw new Error('Canvas is not supported in this browser.');

  canvas.width = size;
  canvas.height = size;
  context.imageSmoothingEnabled = false;
  context.fillStyle = background;
  context.fillRect(0, 0, size, size);
  context.fillStyle = foreground;

  for (let row = 0; row < count; row += 1) {
    for (let col = 0; col < count; col += 1) {
      if (!matrix[row][col]) continue;
      const x1 = Math.round((col + margin) * moduleSize);
      const y1 = Math.round((row + margin) * moduleSize);
      const x2 = Math.round((col + margin + 1) * moduleSize);
      const y2 = Math.round((row + margin + 1) * moduleSize);
      context.fillRect(x1, y1, x2 - x1, y2 - y1);
    }
  }

  return canvas;
}
