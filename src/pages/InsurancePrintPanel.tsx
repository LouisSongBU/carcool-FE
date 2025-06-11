import React, { useRef } from "react";
npm uninstall @types/react-to-print

interface InsurancePrintPanelProps {
    selectedDetail: any;        
    showPrintModal: boolean;
    onClose: () => void;
  }

  export default function InsurancePrintPanel({
    selectedDetail,
    showPrintModal,
    onClose,
  }: InsurancePrintPanelProps) {
  const printRef = useRef();

  return (
    <>
      {showPrintModal && selectedDetail && (
        <div className="printOverlay">
          <div className="print-panel-global" ref={printRef}>
            {/* ...你的打印内容... */}
          </div>
          <div className="printBtnRow">
            <ReactToPrint
              trigger={() => <button className="btn btn-primary">打印</button>}
              content={() => printRef.current}
              pageStyle={`
                @page { size: A5 landscape; margin: 0; }
                body { margin: 0; padding: 0; }
                .print-panel-global { 
                  width: 210mm !important;
                  min-height: 148mm !important;
                  padding: 12mm 8mm !important;
                  margin: 0 auto !important;
                  background: #fff !important;
                }
              `}
            />
            <button className="btn btn-secondary ms-2" onClick={onClose}>关闭</button>
          </div>
        </div>
      )}
    </>
  );
}