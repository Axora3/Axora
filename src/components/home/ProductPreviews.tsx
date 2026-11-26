import {
  Check,
  ChevronDown,
  FileSpreadsheet,
  FileText,
  LockKeyhole,
  MoreHorizontal,
  RotateCw,
} from "lucide-react";

export function BrowserChrome({ address }: { address: string }) {
  return (
    <div className="fg-browser-chrome" aria-hidden="true">
      <span className="fg-window-dots">
        <i />
        <i />
        <i />
      </span>
      <span className="fg-address">
        <LockKeyhole size={11} />
        {address}
        <RotateCw size={11} />
      </span>
      <MoreHorizontal size={16} />
    </div>
  );
}

/** Illustrative product data, shared by the hero and category previews. */
export function SpreadsheetPreview({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`fg-sheet ax-light ${compact ? "fg-sheet-compact" : ""}`}>
      <div className="fg-sheet-title">
        <FileSpreadsheet size={15} />
        <span>
          Сарын төсөв<span className="fg-file-extension">.xlsx</span>
        </span>
        <MoreHorizontal size={16} />
      </div>
      {!compact && (
        <div className="fg-sheet-toolbar">
          <span>Файл</span>
          <span>Нүүр</span>
          <span>Оруулах</span>
        </div>
      )}
      <div className="fg-sheet-formula">
        <span>C5</span>
        <i>ƒx</i>
        <span>=SUM(C2:C4)</span>
      </div>
      <table>
        <thead>
          <tr>
            <th aria-label="Мөр" />
            <th>Ангилал</th>
            <th>Бодит · ₮</th>
          </tr>
        </thead>
        <tbody>
          {[
            ["Хоол", "362,500"],
            ["Унаа", "98,000"],
            ["Түрээс", "650,000"],
          ].map(([label, value], i) => (
            <tr key={label}>
              <th>{i + 2}</th>
              <td>{label}</td>
              <td>{value}</td>
            </tr>
          ))}
          <tr className="fg-sheet-total">
            <th>5</th>
            <td>Нийт</td>
            <td>1,110,500</td>
          </tr>
        </tbody>
      </table>
      {!compact && (
        <div className="fg-sheet-chart" aria-hidden="true">
          {[62, 80, 48, 92, 70, 56].map((h, i) => (
            <span key={i} style={{ height: `${h}%` }} />
          ))}
        </div>
      )}
      <div className="fg-sheet-tabs">
        <span>+</span>
        <span>
          Төсөв <ChevronDown size={10} />
        </span>
        <span>Тайлан</span>
      </div>
    </div>
  );
}

export function ChecklistPreview({ compact = false }: { compact?: boolean }) {
  return (
    <div
      className={`fg-checklist ax-light ${compact ? "fg-checklist-compact" : ""}`}
    >
      <div className="fg-workspace-crumb">
        <FileText size={13} />
        <span>Хувийн орон зай</span>
        <span>/</span>
        <MoreHorizontal size={15} />
      </div>
      <div className="fg-checklist-heading">
        <span>Хичээлийн төлөвлөгөө</span>
        <span>2 / 3</span>
      </div>
      <div className="fg-checklist-rows">
        {[
          "Математик — бие даалт 3",
          "Англи хэл — эссе",
          "Програмчлал — лаб 5",
        ].map((title, i) => (
          <div key={title} data-done={i < 2}>
            <span className="fg-check-box">{i < 2 && <Check size={11} />}</span>
            <span>{title}</span>
          </div>
        ))}
      </div>
      <div className="fg-checklist-progress">
        <span />
      </div>
      {!compact && (
        <span className="fg-checklist-footnote">Өнөөдрийн ажлууд</span>
      )}
    </div>
  );
}
