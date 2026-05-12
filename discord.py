import discord
import requests
from discord.ext import tasks, commands
import os

TOKEN = os.getenv("DISCORD_TOKEN")
CHANNEL_ID = int(os.getenv("CHANNEL_ID"))

bot = commands.Bot(command_prefix="!", intents=discord.Intents.default())

def get_stock():
    url = "1c7ed90383msh9fd0947dcdd4384p1d7cecjsn43a69a2f2659"
    data = requests.get(url).json()
    return data

@tasks.loop(minutes=60)
async def stock_update():
    channel = bot.get_channel(CHANNEL_ID)
    stock = get_stock()

    message = "**Blox Fruits Stock Update**\n"
    for fruit in stock["fruits"]:
        message += f"- {fruit}\n"

    await channel.send(message)

@bot.event
async def on_ready():
    print(f"Logged in as {bot.user}")
    stock_update.start()

bot.run(TOKEN)
