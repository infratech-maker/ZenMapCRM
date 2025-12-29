using Avalonia;
using Avalonia.Controls;
using Avalonia.Layout;
using System;
using System.Net.WebSockets;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using System.Linq;
using System.Globalization;

namespace CallSenderApp
{
    public partial class MainWindow : Window
    {
        private ClientWebSocket _socket = new();
        private bool _isSending = false;

        public MainWindow()
        {
            InitializeComponent();
            ConnectWebSocket();
            SendButton.Click += async (_, _) => await SendPhoneNumber();
        }

        private async void ConnectWebSocket()
        {
            try
            {
                await _socket.ConnectAsync(new Uri("ws://localhost:8080"), CancellationToken.None);
            }
            catch (Exception ex)
            {
                await MessageBox("接続エラー: " + ex.Message);
            }
        }

        private async Task SendPhoneNumber()
        {
            if (_isSending) return;
            _isSending = true;
            SendButton.IsEnabled = false;

            try
            {
                string rawInput = PhoneNumberBox.Text?.Trim() ?? "";

                // 全角 → 半角に変換し、数字のみ抽出（正規化）
                string phoneNumber = new string(rawInput
                    .Normalize(NormalizationForm.FormKC)
                    .Where(char.IsDigit)
                    .ToArray());

                if (string.IsNullOrEmpty(phoneNumber))
                {
                    await MessageBox("電話番号を入力してください。");
                    return;
                }

                if (phoneNumber.Length != 10 && phoneNumber.Length != 11)
                {
                    await MessageBox("正しい電話番号（10〜11桁）を入力してください。");
                    return;
                }

                // WebSocket接続状態確認
                if (_socket == null || _socket.State != WebSocketState.Open)
                {
                    _socket?.Dispose();
                    _socket = new ClientWebSocket();
                    try
                    {
                        await _socket.ConnectAsync(new Uri("ws://localhost:8080"), CancellationToken.None);
                    }
                    catch (Exception ex)
                    {
                        await MessageBox("再接続エラー: " + ex.Message);
                        return;
                    }
                }

                string message = $"{{\"type\":\"call\",\"number\":\"{phoneNumber}\"}}";
                byte[] buffer = Encoding.UTF8.GetBytes(message);

                await _socket.SendAsync(buffer, WebSocketMessageType.Text, true, CancellationToken.None);
                await MessageBox("送信しました: " + phoneNumber);
            }
            catch (Exception ex)
            {
                await MessageBox("送信エラー: " + ex.Message);
            }
            finally
            {
                SendButton.IsEnabled = true;
                _isSending = false;
            }
        }

        private async Task MessageBox(string message)
        {
            var text = new TextBlock { Text = message, Margin = new Thickness(10) };
            var button = new Button { Content = "OK", Margin = new Thickness(10), HorizontalAlignment = HorizontalAlignment.Center };

            var panel = new StackPanel();
            panel.Children.Add(text);
            panel.Children.Add(button);

            var dialog = new Window
            {
                Width = 300,
                Height = 100,
                Content = panel
            };

            button.Click += (_, _) => dialog.Close();
            await dialog.ShowDialog(this);
        }
    }
}
