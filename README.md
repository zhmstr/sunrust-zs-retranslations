# [Sunrust](https://sunrust.org/) Zombie Survival Translations


English is the standard language that you should base your ID's off of.
If something isn't found in your language file then it will fall back to English.

## How To Contribute
You can contribute by translating by one of languages which GMod supports, you can see the table [here](https://wiki.facepunch.com/gmod/Addon_Localization#supportedlanguages).

1. Clone this repository in your local computer, either with `git clone` or preferably with GitHub [Desktop](https://desktop.github.com/download/) or [CLI](https://cli.github.com/)
2. In the cloned repository, on your system. 
3. Go to `translations/`
4. Duplicate the folder `en` and rename to a compatible language code (e.g.: `pl` will be Polish language.)
5. Modify the JSON files in the folder that you've duplicated


## Rules

1. Only translate formally. Do not translate with slang, improper grammar, spelling, etc.
2. Do not translate proper things. For example, do not translate Zombie Survival (the name of the game). Do translate "survive the zombies".
    - For names of weapons, you would translate only the "Handgun" part of 'Peashooter' Handgun (and the quotes if your language doesn't use ' as quotes)
    - For names of classes, you would translate **Bloated Zombie** to whatever the word for Bloated and Zombie are. But you wouldn't translate **Pukepus** or **Bonemesh**.
3. Comment out things that you have not yet translated in your language file.
4. Do not remove string patterns in translations (`%d`, `%s`, `%q` and any other which starts with `%`)

## Notes

If there's a missing text ID in this repository, you can add it manually by using RegEX
1. Go to Visual Studio Code or any tool which supports RegEx replace
2. Put in Find the code: `translate\.AddLocalization\("(\w+)", \{\n\s+\["en"\]\s*=\s*(".+")[,\s][\s\S]*?\}\s*\)`
3. And then set this in Replace: `"$1": $2,`


Don't worry about comments in JSON, it will be ignored.
