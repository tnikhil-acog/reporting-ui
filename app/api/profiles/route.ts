import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import os from "os";

interface Profile {
  provider: string;
  model: string;
  apiKey: string;
}

interface ProfileWithName extends Profile {
  name: string;
}

interface ConfigFile {
  defaultProfile: string;
  profiles: Record<string, Profile>;
}

const CONFIG_PATH = path.join(os.homedir(), ".framework-cli", "config.json");

export async function GET() {
  try {
    const configContent = await fs.readFile(CONFIG_PATH, "utf-8");
    const config: ConfigFile = JSON.parse(configContent);

    return NextResponse.json({
      success: true,
      defaultProfile: config.defaultProfile,
      profiles: Object.entries(config.profiles).map(([name, profile]) => ({
        name,
        provider: profile.provider,
        model: profile.model,
        apiKey: profile.apiKey,
      })),
    });
  } catch (error) {
    console.error("[API] Error reading profiles:", error);
    return NextResponse.json(
      {
        error: "Failed to read profiles",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, provider, model, apiKey } = body;

    if (!name || !provider || !model || !apiKey) {
      return NextResponse.json(
        { error: "Missing required fields: name, provider, model, apiKey" },
        { status: 400 }
      );
    }

    // Read existing config
    const configContent = await fs.readFile(CONFIG_PATH, "utf-8");
    const config: ConfigFile = JSON.parse(configContent);

    // Add or update profile
    config.profiles[name] = {
      provider,
      model,
      apiKey,
    };

    // Write back to file
    await fs.writeFile(CONFIG_PATH, JSON.stringify(config, null, 2));

    return NextResponse.json({
      success: true,
      message: `Profile "${name}" saved successfully`,
    });
  } catch (error) {
    console.error("[API] Error saving profile:", error);
    return NextResponse.json(
      {
        error: "Failed to save profile",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { defaultProfile } = body;

    if (!defaultProfile) {
      return NextResponse.json(
        { error: "Missing required field: defaultProfile" },
        { status: 400 }
      );
    }

    // Read existing config
    const configContent = await fs.readFile(CONFIG_PATH, "utf-8");
    const config: ConfigFile = JSON.parse(configContent);

    // Check if profile exists
    if (!config.profiles[defaultProfile]) {
      return NextResponse.json(
        { error: `Profile "${defaultProfile}" does not exist` },
        { status: 404 }
      );
    }

    // Update default profile
    config.defaultProfile = defaultProfile;

    // Write back to file
    await fs.writeFile(CONFIG_PATH, JSON.stringify(config, null, 2));

    return NextResponse.json({
      success: true,
      message: `Default profile set to "${defaultProfile}"`,
    });
  } catch (error) {
    console.error("[API] Error updating default profile:", error);
    return NextResponse.json(
      {
        error: "Failed to update default profile",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const profileName = url.searchParams.get("name");

    if (!profileName) {
      return NextResponse.json(
        { error: "Missing query parameter: name" },
        { status: 400 }
      );
    }

    // Read existing config
    const configContent = await fs.readFile(CONFIG_PATH, "utf-8");
    const config: ConfigFile = JSON.parse(configContent);

    if (!config.profiles[profileName]) {
      return NextResponse.json(
        { error: `Profile "${profileName}" does not exist` },
        { status: 404 }
      );
    }

    // Prevent deleting the default profile
    if (config.defaultProfile === profileName) {
      return NextResponse.json(
        {
          error:
            "Cannot delete the default profile. Set a different default profile first.",
        },
        { status: 400 }
      );
    }

    // Delete profile
    delete config.profiles[profileName];

    // Write back to file
    await fs.writeFile(CONFIG_PATH, JSON.stringify(config, null, 2));

    return NextResponse.json({
      success: true,
      message: `Profile "${profileName}" deleted successfully`,
    });
  } catch (error) {
    console.error("[API] Error deleting profile:", error);
    return NextResponse.json(
      {
        error: "Failed to delete profile",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
