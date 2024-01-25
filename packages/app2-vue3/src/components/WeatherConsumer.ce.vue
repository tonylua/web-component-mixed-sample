<template>
  <div class="consumer" @click="onClick">
    <h1 style="color: #ddd">&lt;vue3-weather-consumer/&gt;</h1>
    {{ city }}: {{ temperature }}℃
  </div>
</template>

<script setup lang="ts">
// import {withDefaults, defineProps, defineEmits} from 'vue';

interface IProps {
  city: string,
  temperature?: number;
}
const props = withDefaults(defineProps<IProps>(), {
  city: 'unknown'
});

interface IEmit {
  (e: 'msg', value: string): void
}
const emit = defineEmits<IEmit>();

  const onClick = () => emit('msg', props.city);
</script>

<style scoped>
:host .consumer {
  border: 1px solid var(--vue3-color, #336699);
  border-radius: 10px;
  width: 300px;
  box-sizing: border-box;
  padding: 20px;
}
</style>
