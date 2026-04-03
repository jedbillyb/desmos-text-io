const editor = ace.edit("editor");
editor.getSession().setMode("ace/mode/json");

// Dark mode ace theme
if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
    editor.setTheme("ace/theme/monokai");
}

const btnImport = document.getElementById("btn_import");
const btnExport = document.getElementById("btn_export");
const btnCopy = document.getElementById("btn_copy");
const btnDownload = document.getElementById("btn_download");
const btnFormat = document.getElementById("btn_format");
const fileInput = document.getElementById("file_input");
const feedback = document.getElementById("feedback");
const charCount = document.getElementById("char_count");

btnImport.disabled = true;

function isValidJson(str) {
    try { JSON.parse(str); return true; } catch { return false; }
}

function setFeedback(msg, isError = false) {
    feedback.textContent = msg;
    feedback.style.color = isError ? "#e74c3c" : "#2ecc71";
}

function updateStats() {
    const val = editor.getValue();
    charCount.textContent = `${val.length} chars`;
    if (val.length === 0) {
        btnImport.disabled = true;
        setFeedback("");
    } else if (isValidJson(val)) {
        btnImport.disabled = false;
        setFeedback("✓ Valid JSON");
    } else {
        btnImport.disabled = true;
        setFeedback("✗ Invalid JSON — check syntax", true);
    }
}

editor.getSession().on("change", updateStats);

// Export
btnExport.addEventListener("click", () => {
    browser.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        browser.tabs.sendMessage(tabs[0].id, { message: "export" }, (response) => {
            editor.setValue(response, -1);
            setFeedback("✓ Exported");
        });
    });
});

// Import
btnImport.addEventListener("click", () => {
    browser.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const state_json = editor.getValue();
        browser.tabs.sendMessage(tabs[0].id, { message: "import", state_json }, () => {
            setFeedback("✓ Imported");
        });
    });
});

// Copy to clipboard
btnCopy.addEventListener("click", () => {
    navigator.clipboard.writeText(editor.getValue()).then(() => {
        setFeedback("✓ Copied to clipboard");
    });
});

// Download as .json file
btnDownload.addEventListener("click", () => {
    const val = editor.getValue();
    if (!val) return setFeedback("✗ Nothing to download", true);
    const blob = new Blob([val], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "desmos-graph.json";
    a.click();
    URL.revokeObjectURL(url);
    setFeedback("✓ Downloaded");
});

// Format/prettify JSON
btnFormat.addEventListener("click", () => {
    const val = editor.getValue();
    if (isValidJson(val)) {
        editor.setValue(JSON.stringify(JSON.parse(val), null, 2), -1);
        setFeedback("✓ Formatted");
    } else {
        setFeedback("✗ Cannot format invalid JSON", true);
    }
});

// Load from file
fileInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
        editor.setValue(e.target.result, -1);
        setFeedback("✓ File loaded");
    };
    reader.readAsText(file);
});

// Keyboard shortcuts
document.addEventListener("keydown", (e) => {
    if (e.ctrlKey && e.key === "e") { e.preventDefault(); btnExport.click(); }
    if (e.ctrlKey && e.key === "i") { e.preventDefault(); if (!btnImport.disabled) btnImport.click(); }
});