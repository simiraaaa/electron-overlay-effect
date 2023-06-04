<script>
  import { debounce } from "$lib/scripts/util";
  import { onMount } from "svelte";

  /** @type {HTMLTextAreaElement | undefined} */
  let textareaElement;

  let saved = false;

  onMount(async () => {
    if (!textareaElement) return;
    textareaElement.value = await electron.getChapterText(); 
  })

  const onInput = () => {
    saved = false;
    debouncedSave();
  };

  const getFormattedText = () => {
    if (!textareaElement) return '';
    return textareaElement.value.split('\n').map((line) => {
      return line.trim();
    }).filter(Boolean).join('\n');
  };

  const save = async () => {
    const text = getFormattedText();
    await electron.setChapterText(text);
    saved = true;
  };

  const debouncedSave = debounce(save, 1000);
</script>


<section>
  <div class={saved ? "saved" : "not-saved"}>{ saved ? "保存済み" : "未保存" }</div>

  <textarea bind:this={textareaElement} on:input={onInput}></textarea>
</section>

<style>

  section {
    height: 100%;
    padding: 0 8px;
    display: flex;
    flex-direction: column;
    justify-content: center;
  }

  textarea {
    margin-top: 8px;
    padding: 8px;

    width: 100%;
    height: 100%;
    flex-grow: 1;
  }

  .saved {
    flex-shrink: 0;
    font-size: 14px;
    color: green;
  }

  .not-saved {
    flex-shrink: 0;
    font-size: 14px;
    color: gray;
  }
</style>