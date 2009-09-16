class WysiwygPicturesController < ActionController::Base
  skip_before_filter :verify_authenticity_token

  def create
    @picture = WysiwygPicture.new(:file => params[:file])
    @element_id = params[:element_id]

    respond_to do |format|      
      format.js do
        if @picture.save
          render_success
        else
          render_failure
        end
      end
    end
  end

  def render_success
    responds_to_parent do
      render :js => "wysiwyg.#{@element_id}.editor_cmd('insertImage', '#{@picture.file.url}'); $.unblockUI();"
    end
  end

  def render_failure
    responds_to_parent do
      render :js => "alert('Upload Failed.'); $.unblockUI();"
    end
  end
end

