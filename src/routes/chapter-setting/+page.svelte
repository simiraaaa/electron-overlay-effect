<script>
  import { chapterIndex, chapterText } from "$lib/scripts/app";
  import { debounce } from "$lib/scripts/util";
  import { onMount } from "svelte";

  /** @type {HTMLTextAreaElement | undefined} */
  let textareaElement;
  $: lineNumber = $chapterIndex + 1;
  
  let saved = false;

  onMount(async () => {
    if (!textareaElement) return;
    textareaElement.value = await electron.getChapterText(); 
  })

  const onInput = () => {
    saved = false;
    debouncedSave();
  };

  const onInputIndex = () => {
    saved = false;
    debouncedSaveIndex();
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

  const saveIndex = async () => {
    await electron.setChapterIndex(lineNumber - 1);
    saved = true;
  };

  const debouncedSave = debounce(save, 250);
  const debouncedSaveIndex = debounce(saveIndex, 250);

  $: chapterLine = $chapterText.split('\n')[lineNumber - 1];
</script>


<section>
  <div class={saved ? "saved" : "not-saved"}>{ saved ? "保存済み" : "未保存" }</div>
  <div class="index-setting">
    <label class="f fm">
      表示する行:
      <input type="number" bind:value={lineNumber} min="1" max="{$chapterText.split('\n').length}" on:input={onInputIndex}/>
    </label>
  </div>
  <div class="fs12">現在の表示:</div>
  <div class="fs14 bold"> {chapterLine}</div>
  <textarea bind:this={textareaElement} on:input={onInput}></textarea>
</section>

<style>

  .f {
    display: flex;
  }
  .fm {
    align-items: center;
  }

  .fs12 {
    font-size: 12px;
  }
  .fs14 {
    font-size: 14px;
  }

  .bold {
    font-weight: bold;
  }

  .index-setting {
    font-size: 14px;
    margin: 8px 0;
  }
  .index-setting input {
    width: 40px;
    margin-left: 8px;
  } 

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