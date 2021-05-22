import React, { useRef } from "react";
import AceEditor from "react-ace";

import { useAppStateContext } from "../state";

import "ace-builds/src-noconflict/mode-html";
import "ace-builds/src-noconflict/theme-monokai";

export const TemplateRoute = () => {
  const templateRef = useRef();

  const { setTemplate } = useAppStateContext();

  return (
    <div className="mt-3">
      <div className="mb-3">
        <label className="form-label">Template</label>
        <AceEditor
          ref={templateRef}
          mode="html"
          theme="monokai"
          name="UNIQUE_ID_OF_DIV"
          editorProps={{ $blockScrolling: true }}
          setOptions={{
            useWorker: false,
          }}
          width="100%"
        />
      </div>

      <div className="mb-3">
        <button
          className="btn btn-outline-primary"
          onClick={() => setTemplate(templateRef.current.editor.getValue())}
        >
          set template
        </button>
      </div>
    </div>
  );
};
