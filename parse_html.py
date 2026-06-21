import sys
from bs4 import BeautifulSoup

html = sys.stdin.read()
soup = BeautifulSoup(html, 'html.parser')
print(soup.get_text(separator='\n', strip=True))
