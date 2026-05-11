import json
from openai import AsyncOpenAI
from app.services.google_books import run_tool

TOOLS = [
    {
        "type": "function",
        "name": "get_books_by_title",
        "description": "Search Google Books by title. Use when the user looks for a book by title.",
        "parameters": {
            "type": "object",
            "properties": {"title": {"type": "string"}},
            "required": ["title"],
            "additionalProperties": False,
        },
        "strict": True,
    },
    {
        "type": "function",
        "name": "get_books_by_author",
        "description": "Search Google Books by author name.",
        "parameters": {
            "type": "object",
            "properties": {"author": {"type": "string"}},
            "required": ["author"],
            "additionalProperties": False,
        },
        "strict": True,
    },
    {
        "type": "function",
        "name": "get_books_by_isbn",
        "description": "Search Google Books by ISBN-10 or ISBN-13.",
        "parameters": {
            "type": "object",
            "properties": {"isbn": {"type": "string"}},
            "required": ["isbn"],
            "additionalProperties": False,
        },
        "strict": True,
    },
]


async def answer_with_tools(user_text: str) -> list[dict]:
    client = AsyncOpenAI()
    response = await client.responses.create(
        model="gpt-4.1",
        input=[
            {
                "role": "system",
                "content": "You are a helpful book assistant. Use tools when needed.",
            },
            {"role": "user", "content": user_text},
        ],
        tools=TOOLS,
        tool_choice="auto",
    )
    output = response.output or []
    tool_calls = [o for o in output if o.type == "function_call"]
    if not tool_calls:
        return []
    results: list[dict] = []
    for call in tool_calls:
        args = (
            json.loads(call.arguments)
            if isinstance(call.arguments, str)
            else call.arguments
        )
        books = await run_tool(call.name, args)
        results.extend(books)
    return results
