export const metadata = {
  title: "iPES Tournament Leaderboard",
  description: "Real-time iPES tournament leaderboard",
};

export default function RootLayout({ children }) {
  return (
    <html lang="th">
      <body style={{ margin: 0 }}>{children}</body>
    </html>
  );
}

