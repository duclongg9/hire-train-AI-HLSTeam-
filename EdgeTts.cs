using System;
using System.Diagnostics;
using System.IO;
using System.Threading.Tasks;
using NAudio.Wave;

namespace MyTTSProj
{
    internal class EdgeTts : IEdgeTts
    {
        private const string Voice = "ja-JP-NanamiNeural";

        private string _rate;
        private string _volume;

        private Process? _process;
        private WaveOutEvent? _waveOut;
        private Mp3FileReader? _reader;

        public EdgeTts(string rate = "0%", string volume = "0%")
        {
            _rate = rate;
            _volume = volume;
        }

        public async Task Speak(string text)
        {
            // Stop();

            var stream = await SynthesizeAsync(text);
            if (stream == null) return;

            _reader = new Mp3FileReader(stream);
            _waveOut = new WaveOutEvent();

            _waveOut.Init(_reader);
            _waveOut.Play();
        }

        public void Stop()
        {
            try
            {
                _waveOut?.Stop();
                _reader?.Dispose();
                _waveOut?.Dispose();

                _reader = null;
                _waveOut = null;

                if (_process != null && !_process.HasExited)
                {
                    _process.Kill();
                    _process.Dispose();
                }
            }
            catch { }
        }

        private async Task<MemoryStream?> SynthesizeAsync(string text)
        {
            if (string.IsNullOrWhiteSpace(text))
                return null;

            string clean = text
                .Replace("\r", " ")
                .Replace("\n", " ")
                .Replace("\"", "'")
                .Trim();

            var psi = new ProcessStartInfo
            {
                FileName = "python",
                Arguments = $"-m edge_tts --voice \"{Voice}\" --text \"{clean}\" --write-media - --rate=\"{_rate}\" --volume=\"{_volume}\"",
                RedirectStandardOutput = true,
                RedirectStandardError = true,
                UseShellExecute = false,
                CreateNoWindow = true
            };


            try
            {
                _process = Process.Start(psi);
                if (_process == null) return null;

                var ms = new MemoryStream();

                await _process.StandardOutput.BaseStream.CopyToAsync(ms);

                string err = await _process.StandardError.ReadToEndAsync();
                await _process.WaitForExitAsync();

                if (!string.IsNullOrWhiteSpace(err))
                    return null;

                ms.Position = 0;
                return ms;
            }
            catch
            {
                return null;
            }
        }
    }
}