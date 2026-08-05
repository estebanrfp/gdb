# **Audit Option Documentation**

## **Overview**

The `audit` option is a lightweight, audit parameter for GenosDB.  
When enabled, it scans the oplog for recently added or updated nodes, and deletes any nodes that violate the audit policy.  
The process is fully asynchronous, uses a debounced trigger to avoid flooding the API, and can be configured with a custom prompt.  
When you activate the audit option, the module is loaded dynamically at that moment—no manual import or setup is required.

---

## **Key Features**

| Feature | Description |
|---------|-------------|
| **List-driven policy enforcement** | Uses a language list to evaluate node content against a user-defined prompt. |
| **Debounced execution** | Prevents excessive API calls by waiting 500 ms after the last change. |
| **Automatic cleanup** | Deletes nodes that match the audit criteria directly from the database and oplog. |
| **Customizable prompt** | Pass a prompt string when initializing the database to tailor the audit logic. |
| **Graceful error handling** | Logs API errors and continues operation without crashing the application. |

---

## **Installation**

The audit option is included with GenosDB.  
To enable it, simply initialize your database with the `audit` parameter y un prompt personalizado:

```javascript
import { gdb } from "genosdb";

const db = await gdb("my-db", {
  rtc: true,
  audit: { prompt: "detect offensive or inappropriate language, spam [find closely spaced timestamps] or prohibited content" }
});
```

---

## **Example**

You can see a practical implementation in the following example:

[Open Todo List Audit Example](https://estebanrfp.github.io/gdb/examples/todolist-audit.html)