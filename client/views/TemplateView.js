import React, { useRef } from "react";
import AceEditor from "react-ace";

import { useContractContext } from "../state";
import { TransactionButton } from "../components/TransactionButton";
import { Page } from "../components/Page";

import "ace-builds/src-noconflict/mode-html";
import "ace-builds/src-noconflict/theme-monokai";

export const TemplateView = () => {
  const templateRef = useRef();

  const { setTemplate } = useContractContext();

  const scopeId = `admin-template`;

  return (
    <Page>
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
        <TransactionButton
          scopeId={scopeId}
          text="set template"
          onClick={() =>
            setTemplate(scopeId, templateRef.current.editor.getValue())
          }
        />
      </div>
    </Page>
  );
};
