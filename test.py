import requests

url = "https://s3.us-east-2.amazonaws.com/structuralab.com/0e9b864a-400f-45df-abed-583260f5571e/1_wide_xp_bank_with_loader.mcstructure?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=ASIAXW4E4YEQFDOBI73W%2F20240113%2Fus-east-2%2Fs3%2Faws4_request&X-Amz-Date=20240113T041640Z&X-Amz-Expires=3600&X-Amz-SignedHeaders=host&X-Amz-Security-Token=IQoJb3JpZ2luX2VjEKz%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FwEaCXVzLWVhc3QtMiJHMEUCIQCxkK98gatviG9R%2F6d8ps%2B37K%2BLrKbEGG%2BLELxniZs8dQIgYshCuiso%2BfwyOAHxV%2Fo%2Fr7hAvbzm19Np4DPRk4uDSQQq9AIIVRADGgw1MzAxNzAyOTg2NTYiDD%2BxLs%2BmR5OXps0ScCrRAnCBdNLWXSJ2Dg9GfCabFGilyfhN8%2BOzaAhVxZtzI6KudY71qYJhuw11GOCWj2aIL90EJPO6r4cnr%2BJ4Km2Tp07jFJoTQmsrlT9b0o5nI%2F%2B4qiUftY85JDzh3ZU3Xj8%2BJGWYyl1GC9ozJpeuncGTL5lxz%2BpyHwxVBc9cQJ0zuF2wLAwb2KaH6QG8GcD5iWuF6Kn544Do7HUS%2FW1J3pLg0mRmZAVI9%2FcWIwZEsyZfl1nMImiyfL9MQXq%2FHPO%2Bx5pXZFIWVhehvrQr8xuxxFFWjNHX%2F29cmZ1m05QaJuhEIry3bO%2BxYfavDAF9kstmyxe8f4jl74hZpj0B55SGo%2BJLuH%2FyBledT0%2FhMZjjzuUpx1xXJDj0k%2BOibGkHIjyy97Crrd%2FHHgDztIJ3oDqW03sKJIE29YuEApNvIcB4vm7uT31Wsn0RhCzeRHFjNHYYBV8p9Kgwpp2IrQY6ngFuY5R41pcZ%2BQSQAuCYewB3UjPxHbSd0a47cVrrvWKHZHHlIgMa5WmwrqcjZnbLs5LAMx6sWbsKs%2FB5HhjEWX7FcIwWDT5fZoqzLuk5yK4On9X%2Ft3%2BW7z21WS3ag85HFN9n00ViIE%2B9LO1XRHc12jE52xVrpDzwbd4A2Uko%2B8QL0XTsDBXQceq4xlkeLV4%2BI5FNS%2F19o4dnTusMRrMT%2Bw%3D%3D&X-Amz-Signature=74e0dcb14b343c3b3f6a7c3c5767486ae9c12353ef37899b25549b2eb2b97593"


object_name = 'C:\\Users\\camer\\OneDrive\\Documents\\GitHub\\Structura\\test_structures\\1 wide xp bank with loader.mcstructure'

with open(object_name, 'rb') as f:
    files = {'file': (object_name, f)}
    http_response = requests.post(url, files=files)

print(f'File upload HTTP status code: {http_response.status_code}')
