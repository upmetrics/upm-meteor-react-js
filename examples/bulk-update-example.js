// Example: How to refactor your React + Meteor code to use bulk operations

import Meteor from '@nyby/meteor-react-js';

// Your existing BusinessSettingsCollection
const BusinessSettingsCollection = new Meteor.Mongo.Collection('businessSettings');

const saveAiPreferences = async (data) => {
  setProcessing(true);

  try {
    // Update user preferences first
    userService.updateUserData(
      {
        'preferences.hideAI': data.hideAI,
        'preferences.applyToAllWorkspaces': data.applyToAllWorkspaces,
      },
      async function () {
        console.log('data', data);

        if (data.applyToAllWorkspaces) {
          // SOLUTION 1: Using updateMany (recommended for your use case)
          // This updates all matching documents in a single server call
          BusinessSettingsCollection.updateMany(
            { _id: { $in: existingWorkspaces.map((w) => w._id) } }, // selector for multiple IDs
            { $set: { 'ai.hideAI': data.hideAI } }, // modifier
            (err, result) => {
              if (err) {
                console.error('Error updating business settings:', err);
                notificationsService.error('Failed to update workspace settings');
              } else {
                console.log(`Updated ${result.modifiedCount} workspaces`);
              }
            }
          );

          // SOLUTION 2: Using bulkUpdate (if you need different updates per workspace)
          /*
        const updates = existingWorkspaces.map(workspace => ({
            selector: { _id: workspace._id },
            modifier: { $set: { 'ai.hideAI': data.hideAI } }
        }));

        BusinessSettingsCollection.bulkUpdate(updates, (err, results) => {
            if (err) {
                console.error("Error in bulk update:", err);
                notificationsService.error('Failed to update workspace settings');
            } else {
                console.log('Bulk update completed:', results);
            }
        });
        */
        }
      }
    );

    onClose();
    notificationsService.success('MOD_SETTING_MANAGE_AI.APPLIED_SUCCESSFULLY');
    if (onClose) onClose(); // Call onClose to close modal/dialog if provided
  } catch (error) {
    console.error('Error updating AI settings:', error);
    notificationsService.error('Failed to update AI settings');
  } finally {
    setProcessing(false);
  }
};

// Alternative approach using async/await with promises
const saveAiPreferencesAsync = async (data) => {
  setProcessing(true);

  try {
    // Promisify the userService call
    await new Promise((resolve, reject) => {
      userService.updateUserData(
        {
          'preferences.hideAI': data.hideAI,
          'preferences.applyToAllWorkspaces': data.applyToAllWorkspaces,
        },
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });

    if (data.applyToAllWorkspaces) {
      // Promisify the bulk update
      await new Promise((resolve, reject) => {
        BusinessSettingsCollection.updateMany(
          { _id: { $in: existingWorkspaces.map((w) => w._id) } },
          { $set: { 'ai.hideAI': data.hideAI } },
          (err, result) => {
            if (err) reject(err);
            else resolve(result);
          }
        );
      });
    }

    onClose();
    notificationsService.success('MOD_SETTING_MANAGE_AI.APPLIED_SUCCESSFULLY');
  } catch (error) {
    console.error('Error updating AI settings:', error);
    notificationsService.error('Failed to update AI settings');
  } finally {
    setProcessing(false);
  }
};

export { saveAiPreferences, saveAiPreferencesAsync };
