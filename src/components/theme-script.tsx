export const ThemeScript = () => {
    const script = `
    (function() {
      try {
        var storageKey = 'settings-storage';
        var className = 'dark';
        var d = document.documentElement;
        
        var theme = 'system';
        var stored = localStorage.getItem(storageKey);
        
        if (stored) {
          try {
            var parsed = JSON.parse(stored);
            if (parsed.state && parsed.state.theme) {
              theme = parsed.state.theme;
            }
          } catch (e) {}
        }
        
        if (theme === 'system') {
          var isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
          if (isDark) d.classList.add(className);
          else d.classList.remove(className);
        } else if (theme === 'dark') {
          d.classList.add(className);
        } else {
          d.classList.remove(className);
        }
      } catch (e) {}
    })();
  `;

    return (
        <script
            dangerouslySetInnerHTML={{
                __html: script,
            }}
        />
    );
};
