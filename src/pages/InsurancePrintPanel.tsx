import React, { useRef } from "react";
import { useReactToPrint } from "react-to-print";

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
  // 一定给 ref 写明类型，并以 null 初始化
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    contentRef: printRef, // v3 用 contentRef，而不是 content()
    pageStyle: `
      @page { size: A5 landscape; margin: 0; }
      body { margin: 0; padding: 0; }
      .print-panel-global { 
        width: 210mm !important;
        min-height: 148mm !important;
        padding: 12mm 8mm !important;
        margin: 0 auto !important;
        background: #fff !important;
      }
    `,
    documentTitle: selectedDetail?.id ? `Insurance-${selectedDetail.id}` : "Insurance",
  });

  return (
    <>
      {showPrintModal && selectedDetail && (
        <div className="printOverlay">
          <div className="print-panel-global" ref={printRef}>
            {/* ...你的打印内容... */}
          </div>

          <div className="printBtnRow">
            <button className="btn btn-primary" onClick={handlePrint}>
              打印
            </button>
            <button className="btn btn-secondary ms-2" onClick={onClose}>
              关闭
            </button>
          </div>
        </div>
      )}
    </>
  );
}
