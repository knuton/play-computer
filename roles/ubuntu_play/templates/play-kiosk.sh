#!/bin/sh

# disable power saving, screensaver and screen dimming
gsettings set org.gnome.settings-daemon.plugins.power idle-dim false
gsettings set org.gnome.settings-daemon.plugins.power sleep-inactive-ac-timeout 0
gsettings set org.gnome.desktop.screensaver lock-enabled false
gsettings set org.gnome.desktop.screensaver logout-enabled false
gsettings set org.gnome.desktop.screensaver ubuntu-lock-on-suspend false
gsettings set org.gnome.desktop.session idle-delay 0

# force chromium to think it exited cleanly
sed -i 's/"exited_cleanly":false/"exited_cleanly":true/' ~/.config/chromium/Default/Preferences
sed -i 's/"exit_type":"Crashed"/"exit_type":"None"/' ~/.config/chromium/Default/Preferences

# start chromium in kiosk mode...for ever. ever. ever, ever ever?
while true
do
  chromium-browser --disable-infobars --kiosk https://play.dividat.com/
done

# I'm sorry miss Jackson. I am for real...
