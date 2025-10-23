#!/usr/bin/env python3
"""
Test script to verify Gemini API setup and classification functionality.
"""

import os
import google.generativeai as genai
from pathlib import Path

def test_gemini_setup():
    """Test if Gemini API is properly configured"""
    try:
        # Try to read from ../../gemini.txt first
        gemini_file = Path('/Users/lance/Documents/GitHub/gemini.txt')
        if gemini_file.exists():
            with open(gemini_file, 'r') as f:
                api_key = f.read().strip()
            print(f"✅ Loaded Gemini API key from: {gemini_file}")
        else:
            # Fallback to environment variable
            api_key = os.getenv('GEMINI_API_KEY')
            if not api_key:
                print("❌ Could not find Gemini API key")
                print("Please either:")
                print("1. Create ../gemini.txt with your API key")
                print("2. Set GEMINI_API_KEY environment variable")
                return False
            print("✅ Loaded Gemini API key from environment variable")
    except Exception as e:
        print(f"❌ Error reading API key: {e}")
        return False
    
    try:
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel('gemini-2.0-flash-exp')
        
        # Test with a simple prompt
        test_prompt = """
        Please respond with a simple JSON object:
        {
            "status": "working",
            "message": "Gemini API is configured correctly"
        }
        """
        
        response = model.generate_content(test_prompt)
        print("✅ Gemini API is working correctly!")
        print(f"Response: {response.text}")
        return True
        
    except Exception as e:
        print(f"❌ Error testing Gemini API: {e}")
        return False

if __name__ == "__main__":
    test_gemini_setup()
