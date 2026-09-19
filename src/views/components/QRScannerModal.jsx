import { useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

export default function QRScannerModal({ onScan, onClose }) {
  const scannerRef = useRef(null);
  const html5QrRef = useRef(null);

  useEffect(() => {
    const qrRegionId = 'qr-reader-region';
    const html5Qr = new Html5Qrcode(qrRegionId);
    html5QrRef.current = html5Qr;

    Html5Qrcode.getCameras()
      .then((devices) => {
        if (!devices || !devices.length) return;
        const cameraId = devices[0].id;
        html5Qr
          .start(
            cameraId,
            { fps: 10, qrbox: 220 },
            (decodedText) => {
              onScan(decodedText);
              html5Qr.stop().then(() => html5Qr.clear());
            },
            () => {}
          )
          .catch((err) => console.error('QR start error', err));
      })
      .catch((err) => console.error('Camera access error', err));

    return () => {
      if (html5QrRef.current) {
        html5QrRef.current
          .stop()
          .then(() => html5QrRef.current.clear())
          .catch(() => {});
      }
    };
  }, [onScan]);

  return (
    <div className="qr-modal-overlay" onClick={onClose}>
      <div className="qr-modal" onClick={(e) => e.stopPropagation()}>
        <div className="qr-modal-head">
          <div className="card-title">Scan Product QR</div>
          <button className="btn btn-outline" style={{ fontSize: 12 }} onClick={onClose}>
            Close
          </button>
        </div>
        <div id="qr-reader-region" ref={scannerRef} className="qr-reader-box" />
        <div className="qr-modal-hint">Point the camera at the product QR/barcode</div>
      </div>
    </div>
  );
}