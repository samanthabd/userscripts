// ==UserScript==
// @name         Flomo with Text Formatting
// @namespace    tag:vagary.shouter0u@icloud.com
// @version 0.1
// @description  Add formatting to Flomo. Currently handles: code blocks, inline code, org-mode style titles, escaping poundsigns
// @author vagary.shouter0u@icloud.com
// @match v.flomoapp.com/mine*
// @match v.flomoapp.com
// @icon www.google.com

// @grant none
// ==/UserScript==

;(function () {
  "use strict"

  const css = {
    codeBlock: {
      colors: {
        background: "#8fbc8fc7",
        border: "darkseagreen",
        text: "inherit",
        link: {
          text: "",
          hover: {
            text: "",
          },
        },
        dark: {
          background: "#324646",
          border: "darkslategrey",
          text: "#e7ffde",
        },
      },
      font: {
        family: "Inconsolata",
      },
    },
    inlineCode: {
      colors: {
        background: "darkslategray",
        border: "darkslategray",
        text: "#e7ffde",
      },
    },
    tag: {
      colors: {
        dark: {
          background: "#fff00",
          text: "#6f7174",
          border: "#6f7174",
        },
      },
    },
    get styles() {
      return `
  body {
    --code-block-bg: ${this.codeBlock.colors.background};
    --code-block-border-color: ${this.codeBlock.colors.border};
    --code-block-text-colot: ${this.codeBlock.colors.text};
    --inline-code-bg: ${this.inlineCode.colors.background};
    --inline-code-border-color: ${this.inlineCode.colors.borders};
    --inline-code-text-color: ${this.inlineCode.colors.text};
  }
  body.dark_mode {
     --code-block-bg: ${this.codeBlock.colors.dark.background};
    --code-block-border-color: ${this.codeBlock.colors.dark.border};
    --code-block-text-colot: ${this.codeBlock.colors.dark.text};
    --tag-background-color: ${this.tag.colors.dark.background};
    --tag-border-color: ${this.tag.colors.dark.border};
    --tag-text-color: ${this.tag.colors.dark.text};
  }
  code, code a { font-family: '${this.codeBlock.font.family}', monospace;}
  pre {
    white-space: pre-wrap;
    background-color: var(--code-block-bg);
    border: 2px solid var(--code-block-border-color);
    color: var(--code-block-text-color);
    border-radius: 2px;
    padding: 0 .5rem 1rem;
    margin-block: .5rem;
  }
  :not(pre) > code {
    border: 2px solid var(--inline-code-border-color);
    padding-inline: 5px;
    padding-block: 4px;
    background-color: var(--inline-code-bg);
    color: var(--inline-code-text-color);
    border-radius: 3px;
  }
  .richText {
    max-height: 300px !important;
  }
  div.display.all .richText {
    max-height: unset !important;
  }
  .memo .content .tag {
    border: 1px solid transparent;
    padding: 0 4px 3px;
  }
  .memo .content .tool {
  margin-block-end: -5px;
  }
  body.dark_mode .memo .content .tag:not(:hover) {
    background-color: var(--tag-background-color) !important;
    color: var(--tag-text-color) !important;
    border-color: var(--tag-border-color);
  }
  note-title {
  font-size: 1.125rem;
  font-weight: 500;
  }
  `
    },
  }

  /* ------------ MUTATION OBSERVERS ------------ */
  /* --- Main ----
   * Watch for a mutation on parent of all memo elements, so we can apply an 
   * observer to that element*/
  function observeMain() {
    const targetNode = document.querySelector("body");
    const config = {
      attributes: true,
      attributeOldValue: true,
      childList: false,
      subtree: true,
    };
    const callback = (mutationList, observer) => {
      for (const mutation of mutationList) {
        if (mutation.target.className == "memos") {
          observeMemosLoad()
          observeMemoEdit()
          // And now we don't need this observer anymore.
          mainObserver.disconnect()
        }
      }
    }
    const mainObserver = new MutationObserver(callback);
    mainObserver.observe(targetNode, config);
  }
  observeMain();


   /* ---  Oberver to handle infinite scroll ---- /
    * Apply styling to newly loaded memos
    */
  function observeMemosLoad() {
    const targetNode = document.querySelector(".memos");
    const config = { childList: true, subtree: false };
    const callback = (mutationList, observer) => {
      for (const mutation of mutationList) {
        /* if the mutation isn't additive, move on */
        let isAdditiveMutation = !!mutation.addedNodes.length
        if (!isAdditiveMutation) {
          continue
        }

        let addedNode = mutation.addedNodes[0];

        if (addedNode.classList.contains("memo")) {
          let richText = addedNode.querySelector(".richText");
          if (richText) markdownPre(richText);
        }
      }
    }
    const memosLoadObserver = new MutationObserver(callback);
    memosLoadObserver.observe(targetNode, config);
  }

  /* --- Observer to handle memo editing ---
   * Looking for memos going from edit view to regular view, so we can re-style * the content 
   */
  function observeMemoEdit() {
    const targetNode = document.querySelector(".memos");

    const config = {
      attributes: true,
      attributeOldValue: true,
      attributeFilter: ["class"],
      subtree: true,
    }

    const callback = (mutationList, observer) => {
      for (const mutation of mutationList) {
        let target = mutation.target;

        if (!target.classList.contains("display")) {
          continue;
        }

        if (mutation.oldValue == "edit") {
          let memo = target.closest(".memo");
          let richText = memo.querySelector(".richText");
          if (richText) markdownPre(richText);
        }
      }
    } 
    const memosEditObserver = new MutationObserver(callback)
    memosEditObserver.observe(targetNode, config)
  }

  
  function handleHashtags(parentNode) {
    let contentNodes = parentNode.childNodes
    console.log(contentNodes)

    contentNodes.forEach((n, i) => {
      let text = n.innerHTML
      if (text.match(/\\\#/)) {
        text = text.replace(/\\\#/g, "⋕")
        parentNode.childNodes[i].innerHTML = text
        console.log(parentNode.childNodes[i])
      }
    })
  }

  function addCss() {
    const newStyles = document.createElement("style")
    newStyles.innerHTML = css.styles
    document.querySelector("head").appendChild(newStyles)
  }

  function processInlineStyles(p, j, richText) {
    let text = p.innerHTML
    // backticks to code
    text = text.replace(/\\`/g, "&#96").replace(/`(.*)`/g, "<code>$1</code>")
    // escape poundsign
    text = text.replace(/\\<span class="tag">(\#.*)<\/span>/g, "$1")
    // org mode #+TITLE:
    text = text.replace(
      /^(?:<span class="tag">)?\\?(?:\#|⋕)\+TITLE:(?:<\/span>)?(.*)$/i,
      "<note-title>$1</note-title>"
    )
    richText.childNodes[j].innerHTML = text
  }

  /* todo: do we need this? */
  let createEventTriggers = () => {
    let showMoreLinks = document.querySelectorAll(".showBtn > a")
    showMoreLinks.forEach((link) => {
      link.addEventListener("click", (e) => {
        let memo = e.target.closest(".memo")
        markdownPre(memo)
      })
    })
  }

  function markdownPre(memo) {
    //TODO better if we set this up to take the richText element instead of parent memo element?
    const richText = memo.classList.contains("richText")
      ? memo
      : memo.querySelector(".richText")
    const contentPs = [...richText.childNodes]
    let content = []

    /* 1. Tracks if we are inside a code block element, including delimiter
     *
     * 2. Keeps track of our position in the array of nodes.
     *    Because childNodes is a live node list, and we remove elements as
     *    we iterate through them, the index provided in forEach is not in
     *    sync with our desired position.
     *    We can keep track of our place in the live list by updating this
     *    iterator only when we are NOT removing an element.
     *
     * 3. Regular expression for code block delimiter sequence.
     *    Specifically- checks that line starts with sequence (excluding whitespace). Allows for text after,
     *    with the mindset we may want to pass values this way in the future. Could probably be further
     *    refined
     */
    let inCodeBlock = false /* 1 */
    let j = 0 /* 2 */
    const delimRegexp = /^ *```\s{0,2}/ /* 3 */

    contentPs.forEach((p) => {
      if (p.innerHTML?.match(delimRegexp)) {
        /* if we encounter codeblock delimiter and are not in a code block,
        * remove delimiter line
        */
        if (inCodeBlock == false) {
          richText.childNodes[j].remove()

        /* if we ARE in a code block, place the content in the tags, clear the 
         * content array, and advance position in the live list
         */
        } else if (inCodeBlock == true) {
          richText.childNodes[j].outerHTML =
            "<pre><code>&#10;" + content.join("&#10;") + "</code></pre>"
          content = []
          j++
        }
        inCodeBlock = !inCodeBlock

      } else if (inCodeBlock) { 
        /* otherwise, if we are in a code block, save the content and remove the node */
        content.push(p.innerHTML)     
        richText.childNodes[j].remove()

        /* if this is the last element, and we are in an open block, just end the block */
        if (j == richText.childElementCount) {
          richText.childNodes[j].outerHTML =
            "<pre><code>&#10;" + content.join("&#10;") + "</code></pre>"
          content = []
          j++
        }
      } else {
        /* If no code block delimiter, and not already in a code block, check for inline style  */
        processInlineStyles(p, j, richText)
        j++
      }
    })
  }

  function formatMemos() {
    let memos = document.querySelectorAll(".memo")
    memos.forEach((memo) => {
      markdownPre(memo)
    })
  }

  let executeScript = () => {
    observeMain()
    addCss()
    formatMemos()
    createEventTriggers()
  }

  setTimeout(executeScript, 1500)
})()
