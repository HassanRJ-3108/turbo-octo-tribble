import clerk_backend_api
import inspect
import pkgutil

print(f"Version: {getattr(clerk_backend_api, '__version__', 'unknown')}")
print(f"Path: {clerk_backend_api.__file__}")

print("\nTop-level attributes:")
for name in dir(clerk_backend_api):
    if not name.startswith("_"):
        print(f" - {name}")

print("\nSubmodules:")
if hasattr(clerk_backend_api, "__path__"):
    for _, name, _ in pkgutil.iter_modules(clerk_backend_api.__path__):
        print(f" - {name}")

# Try to find authenticate_request
print("\nSearching for authenticate_request:")
try:
    from clerk_backend_api.jwks_helpers import authenticate_request
    print("✅ Found in clerk_backend_api.jwks_helpers")
except ImportError as e:
    print(f"❌ Not in clerk_backend_api.jwks_helpers ({e})")

try:
    from clerk_backend_api import authenticate_request
    print("✅ Found in clerk_backend_api top-level")
except ImportError:
    pass
