window.addEventListener('DOMContentLoaded', async () => {
  const status = document.getElementById('model-status');
  try {
    const viewer = new BpmnJS({container:'#canvas'});
    const response = await fetch('/api/model');
    if (!response.ok) throw new Error('Model tidak dapat dimuat.');
    await viewer.importXML(await response.text());
    const canvas = viewer.get('canvas');
    const container = document.getElementById('canvas');
    function fit() {
      const bounds = container.getBoundingClientRect();
      if (bounds.width < 1 || bounds.height < 1) return;
      canvas.resized();
      canvas.zoom(1);
      canvas.zoom('fit-viewport');
      canvas.zoom(canvas.zoom() * 0.92);
    }
    status.hidden = true;
    await new Promise(resolve => requestAnimationFrame(resolve));
    fit();
    document.getElementById('fit').onclick = fit;
    document.getElementById('zoom-in').onclick = () => canvas.zoom(Math.min(canvas.zoom() * 1.25, 3));
    document.getElementById('zoom-out').onclick = () => canvas.zoom(Math.max(canvas.zoom() / 1.25, .2));
    new ResizeObserver(() => requestAnimationFrame(fit)).observe(container);
  } catch (error) { status.textContent = 'Diagram gagal dimuat. Unduh BPMN untuk membukanya di Camunda Modeler. ' + error.message; ['fit','zoom-in','zoom-out'].forEach(id => document.getElementById(id).disabled = true); }
});
