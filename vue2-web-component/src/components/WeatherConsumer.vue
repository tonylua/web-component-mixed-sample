<template>
  <div class="consumer" @click="onClick">
    <h1 style="color: #ddd">&lt;vue2-weather-consumer/&gt;</h1>
    {{ city }}: {{ temperature }}℃
  </div>
</template>

<script>
export default {
  props: ["city", "temperature"],
  methods: {
    onClick() {
      this.$emit("msg", this.city);
    },
  },
  created() {
    window.abc = 222;
    console.log("vue2 abc", window.abc, window);
  },
};
</script>

<style scoped>
.consumer {
  border: 1px solid #336699;
  border-radius: 10px;
  width: 300px;
  box-sizing: border-box;
  padding: 20px;
}
</style>
