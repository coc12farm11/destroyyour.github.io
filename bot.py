from aiogram import Router, F
from aiogram.types import Message, FSInputFile
from aiogram.filters import Command
import os
from config import CHAT_ID
from pathlib import Path
import sys

router = Router()

is_python = 'Python' in sys.version

if is_python:
    import pyautogui
    import random
    import string

    SCREENSHOT_DIR = Path("screenshots")

    async def take_screenshot():
        SCREENSHOT_DIR.mkdir(exist_ok=True)
        filename = ''.join(random.choices(string.ascii_lowercase + string.digits, k=10)) + '.png'
        full_path = SCREENSHOT_DIR / filename
        screenshot = pyautogui.screenshot()
        screenshot.save(full_path)
        return full_path

    @router.message(Command("screenshot"))
    async def send_screenshot(message: Message):
        filepath = await take_screenshot()
        photo = FSInputFile(filepath)
        await message.bot.send_photo(CHAT_ID, photo)
        os.remove(filepath)
        await message.answer("Скриншот отправлен в указанный чат.")

@router.message(Command("start"))
async def say_hello(message: Message):
    if is_python:
        await message.answer("Привет! Я бот для создания скриншотов. /screenshot")
    else:
        await message.answer("Привет! Я простой бот.")

if not is_python:
    print("Это простой бот без дополнительного функционала.")
