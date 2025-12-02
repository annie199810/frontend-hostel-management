
import React from "react";

function Card(props) {
  var title = props.title;
  var children = props.children;
  var className = props.className || "";

  return (
    <div className={"bg-white rounded-xl shadow-sm border border-slate-100 p-4 md:p-5 " + className}>
      {title && (
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
            {title}
          </h3>
        </div>
      )}
      {children}
    </div>
  );
}

export default Card;
