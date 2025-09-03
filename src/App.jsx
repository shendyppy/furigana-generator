import { useEffect, useState } from "react";
import { Editor } from "react-draft-wysiwyg";
import { convertToRaw, EditorState } from "draft-js";
import draftToHtml from "draftjs-to-html";
import parse from "html-react-parser";

import "./App.css";

const kataToHira = (str) =>
  str.replace(/[\u30a1-\u30f6]/g, (ch) =>
    String.fromCharCode(ch.charCodeAt(0) - 0x60)
  );

const renderTokens = (tokens) =>
  tokens.map((t, i) =>
    t.reading && t.reading !== t.surface_form ? (
      <ruby key={i} style={{ marginRight: 4 }}>
        {t.surface_form}
        <rt style={{ fontSize: "0.6em" }}>{kataToHira(t.reading)}</rt>
      </ruby>
    ) : (
      <span key={i}>{t.surface_form}</span>
    )
  );

function App() {
  const [text, setText] = useState("");
  const [savedTokens, setSavedTokens] = useState(null);
  const [previewState, setPreviewState] = useState(null);
  const [tokens, setTokens] = useState([]);
  const [tokenizer, setTokenizer] = useState(null);
  const [editorState, setEditorState] = useState(EditorState.createEmpty());

  useEffect(() => {
    window.kuromoji
      .builder({
        dicPath: `https://${import.meta.env.VITE_DIC_PATH}`,
      })
      .build((err, tokenizer) => {
        if (err) {
          console.error(err);
        } else {
          setTokenizer(tokenizer);
        }
      });
  }, []);

  const handleTextChange = (e) => {
    let value = e.target.value;

    setText(value);

    if (tokenizer && value) {
      const result = tokenizer.tokenize(value);
      setTokens(result);
    }
  };

  const onEditorStateChange = (state) => {
    setEditorState(state);

    const rawContent = convertToRaw(state.getCurrentContent());
    const baseHtml = draftToHtml(rawContent);

    if (tokenizer) {
      const plainText = editorState.getCurrentContent().getPlainText();
      const tokens = tokenizer.tokenize(plainText);

      let htmlWithRuby = baseHtml;
      tokens.forEach((t) => {
        if (t.reading && t.reading !== t.surface_form) {
          const ruby = `<ruby>${t.surface_form}<rt>${kataToHira(
            t.reading
          )}</rt></ruby>`;
          htmlWithRuby = htmlWithRuby.replace(t.surface_form, ruby);
        }
      });

      setPreviewState(htmlWithRuby);
    }
  };

  const handleSave = () => {
    const rawContent = convertToRaw(editorState.getCurrentContent());
    const baseHtml = draftToHtml(rawContent);

    if (tokenizer) {
      const plainText = editorState.getCurrentContent().getPlainText();
      const tokens = tokenizer.tokenize(plainText);

      let htmlWithRuby = baseHtml;
      tokens.forEach((t) => {
        if (t.reading && t.reading !== t.surface_form) {
          const ruby = `<ruby>${t.surface_form}<rt>${kataToHira(
            t.reading
          )}</rt></ruby>`;
          htmlWithRuby = htmlWithRuby.replace(t.surface_form, ruby);
        }
      });

      setSavedTokens(htmlWithRuby);
      console.log("Saved HTML:", htmlWithRuby);
    }
  };

  return (
    <div
      style={{
        maxWidth: 600,
        fontFamily: "sans-serif",
        margin: "auto",
        height: "80vh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
      }}
    >
      <h2>Input Jepang dengan Furigana Otomatis</h2>

      <input
        value={text}
        onChange={handleTextChange}
        placeholder="contoh: 日本語を勉強します"
        style={{ padding: 8, fontSize: 16 }}
      />

      <div style={{ marginTop: 20, fontSize: "1.5rem", lineHeight: 1.8 }}>
        {text ? (
          renderTokens(tokens)
        ) : (
          <span style={{ color: "#999" }}>Belum ada input</span>
        )}
      </div>

      <div style={{ marginTop: 20 }}>
        <Editor
          editorState={editorState}
          onEditorStateChange={onEditorStateChange}
          editorStyle={{
            minHeight: 120,
            border: "1px solid #ddd",
            padding: "8px",
            overflow: "auto",
          }}
          toolbar={{
            options: ["inline", "list", "history", "textAlign"],
            inline: {
              inDropdown: false,
              options: ["bold", "italic", "underline"],
            },
            list: {
              inDropdown: false,
              options: ["unordered", "ordered"],
            },
            history: {
              inDropdown: false,
              options: ["undo", "redo"],
            },
            textAlign: {
              inDropdown: false,
              options: ["left", "center", "right"],
            },
          }}
        />
        <button onClick={handleSave} style={{ marginTop: 10 }}>
          Save
        </button>
      </div>

      <div style={{ marginTop: 20, fontSize: "1.5rem" }}>
        {previewState ? (
          parse(previewState)
        ) : (
          <span style={{ color: "#999" }}>Belum ada input</span>
        )}
      </div>

      {savedTokens && (
        <div style={{ marginTop: 20 }}>
          <h3>Saved HTML:</h3>
          {savedTokens}
        </div>
      )}
    </div>
  );
}

export default App;
