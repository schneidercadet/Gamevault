let ffmpegInstance: any = null;

export const getFFmpeg = async () => {
  if (!ffmpegInstance) {
    const { createFFmpeg } = await import('@ffmpeg/ffmpeg');
    ffmpegInstance = createFFmpeg({
      log: true,
      corePath: 'https://unpkg.com/@ffmpeg/core@0.10.0/dist/ffmpeg-core.js'
    });
  }
  if (!ffmpegInstance.isLoaded()) {
    await ffmpegInstance.load();
  }
  return ffmpegInstance;
};

export const convertToSupportedFormat = async (file: File) => {
  // Check if already in supported format
  if (['audio/mpeg', 'audio/wav', 'audio/aac'].includes(file.type)) return file;

  // Convert using FFmpeg WASM
  const ffmpeg = await getFFmpeg();
  
  ffmpeg.FS('writeFile', 'input', await fetchFile(file));
  
  await ffmpeg.run(
    '-i', 'input',
    '-codec:a', 'libmp3lame',
    '-b:a', '192k',
    'output.mp3'
  );
  
  const data = ffmpeg.FS('readFile', 'output.mp3');
  return new File([data.buffer], `${file.name}.mp3`, { type: 'audio/mpeg' });
};
