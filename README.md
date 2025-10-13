# [Sunrust](https://sunrust.org/) Zombie Survival Translations

English is the standard language you should base your IDs on.
If something isn't found in your language file then it will fall back to English.

## How To Contribute
You can contribute by translating by one of languages which GMod supports, you can see the table [here](https://wiki.facepunch.com/gmod/Addon_Localization#supportedlanguages).

1. Clone this repository to your computer by using `git clone`, GitHub [Desktop](https://desktop.github.com/download/) or [GitHub CLI](https://cli.github.com/)
2. Navigate to the folder `sunrust-zs-retranslations/translations`
3. Duplicate the folder `en` and rename to a compatible language code (e.g.: `pl` will target to Polish language.)
4. Now modify the JSON files in the folder that you've duplicated

This JSONc
Optionally, you can compile the files to Lua. This step is not required.
1. Make sure you have NodeJS installed
2. Install all dependencies by running `npm install` in the repository folder.
3. Run `npm run build`, once everything is done, check `out/` folder.

## Rules

1. Only translate formally. Do not translate with slang, improper grammar, spelling, etc.
    - For names of weapons, you would translate only the "Handgun" part of 'Peashooter' Handgun (and the quotes if your language doesn't use ' as quotes)
    - For names of classes, you would translate **Bloated Zombie** to whatever the word for Bloated and Zombie are. But you wouldn't translate **Pukepus** or **Bonemesh**.
2. Do not translate proper things. For example, do not translate Zombie Survival (the name of the game). Do translate "survive the zombies".
3. Comment out things that you have not yet translated in your language file.
4. Do not remove string patterns in translations (`%d`, `%s`, `%q`, `<gunname>`, and any other which starts with `%`)

## Notes

- Don't worry about comments in JSON, it will be ignored
